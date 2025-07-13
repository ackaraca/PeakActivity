import os
import logging
import yaml
import importlib
import importlib.util
import inspect
from pathlib import Path

# Langchain import for Google Generative AI
try:
    from langchain_google_genai import ChatGoogleGenerativeAI
    GOOGLE_GENAI_AVAILABLE = True
except ImportError:
    GOOGLE_GENAI_AVAILABLE = False
    logging.warning("langchain-google-genai not found. Please install with 'pip install langchain-google-genai'")

# PraisonAI Agents import
try:
    from praisonaiagents import Agent as PraisonAgent, Task as PraisonTask, PraisonAIAgents
    PRAISONAI_AVAILABLE = True
except ImportError:
    PRAISONAI_AVAILABLE = False
    logging.warning("praisonaiagents not found. Please install with 'pip install praisonaiagents'")

logger = logging.getLogger(__name__)
logging.basicConfig(level=os.environ.get('LOGLEVEL', 'INFO').upper(), format='%(asctime)s - %(levelname)s - %(message)s')

class PraisonAIModel:
    def __init__(self, model_name: str = "gemini-1.5-flash-8b", api_key: str = None):
        """
        Initializes the PraisonAIModel specifically for Gemini 2.5 Flash.

        Args:
            model_name (str): The name of the Gemini model. Defaults to "gemini-1.5-flash-8b".
            api_key (str): The Google API key. This is expected to be provided securely (e.g., from Firebase Functions).
        """
        self.model_name = model_name
        self.api_key = api_key

        if not GOOGLE_GENAI_AVAILABLE:
            raise ImportError(
                "Required Langchain Integration 'langchain-google-genai' not found. "
                "Please install with 'pip install langchain-google-genai'"
            )
        if not self.api_key:
            raise ValueError("API Key for Google Generative AI is required.")

    def get_model(self):
        """
        Returns an instance of the langchain ChatGoogleGenerativeAI client.
        """
        return ChatGoogleGenerativeAI(
            model=self.model_name,
            google_api_key=self.api_key
        )

class AgentsGenerator:
    def __init__(self, agent_config_data: dict, api_key: str, log_level=None):
        """
        Initializes the AgentsGenerator object for PraisonAI framework.

        Parameters:
            agent_config_data (dict): Dictionary containing agent and task configurations.
            api_key (str): The Google API key to be passed to the PraisonAIModel.
            log_level (int, optional): The logging level to use. Defaults to logging.INFO.
        """
        self.agent_config_data = agent_config_data
        self.api_key = api_key
        self.log_level = log_level or logging.getLogger().getEffectiveLevel()
        if self.log_level == logging.NOTSET:
            self.log_level = os.environ.get('LOGLEVEL', 'INFO').upper()

        logging.basicConfig(level=self.log_level, format='%(asctime)s - %(levelname)s - %(message)s')
        self.logger = logging.getLogger(__name__)
        self.logger.setLevel(self.log_level)

        if not PRAISONAI_AVAILABLE:
            raise ImportError("PraisonAI is not installed. Please install it with 'pip install praisonaiagents'")

    def _is_function_or_decorated(self, obj):
        return inspect.isfunction(obj) or hasattr(obj, '__call__')

    def load_tools(self, tools_config: list):
        """
        Loads tools based on the provided configuration.
        This simplified version expects tools to be directly importable or within a specified path.
        """
        loaded_tools = []
        for tool_entry in tools_config:
            tool_name = tool_entry.get('name')
            tool_path = tool_entry.get('path') # Assuming a path to a module/file if not a standard tool
            
            if tool_path:
                try:
                    # Attempt to load from a specific file path
                    spec = importlib.util.spec_from_file_location("custom_tool_module", tool_path)
                    module = importlib.util.module_from_spec(spec)
                    spec.loader.exec_module(module)
                    for name, obj in inspect.getmembers(module, self._is_function_or_decorated):
                        if name == tool_name:
                            loaded_tools.append(obj)
                            break
                except Exception as e:
                    self.logger.warning(f"Error loading tool '{tool_name}' from '{tool_path}': {e}")
            else:
                # Assume it's an inbuilt tool from praisonai_tools or similar structure
                # For this simplified integration, we'll assume tools are handled by PraisonAIAgents internally
                # Or, if we need specific tools, they should be explicitly passed
                self.logger.info(f"Tool '{tool_name}' configured without a path. Assuming it's an inbuilt tool or will be handled by the agent framework.")
                # In a full implementation, you'd dynamically import praisonai_tools or other tool modules
                # For now, we rely on praisonaiagents to handle tool instantiation if needed.
        return loaded_tools

    def generate_and_run_agents(self, topic: str):
        """
        Generates and runs agents and tasks using the PraisonAI framework.

        Parameters:
            topic (str): The topic or goal for the agents.
        """
        agents_data = self.agent_config_data.get("agents", [])
        tasks_data = self.agent_config_data.get("tasks", [])
        
        praison_agents = []
        for agent_config in agents_data:
            model = PraisonAIModel(model_name="gemini-pro", api_key=self.api_key).get_model()
            # Assuming 'tools' can be a list of tool functions or classes
            agent_tools = self.load_tools(agent_config.get("tools", []))
            
            praison_agent = PraisonAgent(
                llm=model,
                name=agent_config.get("name"),
                role=agent_config.get("role"),
                goal=agent_config.get("goal"),
                backstory=agent_config.get("backstory"),
                tools=agent_tools,
                # Other potential parameters from agent_config if needed
            )
            praison_agents.append(praison_agent)
            self.logger.info(f"PraisonAI Agent '{praison_agent.name}' created.")

        praison_tasks = []
        for task_config in tasks_data:
            task_agent = next((a for a in praison_agents if a.name == task_config.get("agent")), None)
            if not task_agent:
                self.logger.error(f"Agent '{task_config.get('agent')}' not found for task '{task_config.get('name')}'")
                continue
            
            praison_task = PraisonTask(
                agent=task_agent,
                description=task_config.get("description"),
                expected_output=task_config.get("expected_output"),
                # Other potential parameters from task_config if needed
            )
            praison_tasks.append(praison_task)
            self.logger.info(f"PraisonAI Task '{praison_task.name}' created.")

        if not praison_agents or not praison_tasks:
            self.logger.error("No PraisonAI agents or tasks were successfully created. Aborting execution.")
            return

        try:
            praison_ai_agents_instance = PraisonAIAgents(
                agents=praison_agents,
                tasks=praison_tasks,
                process="sequential" # Or "hierarchical", depending on your needs
            )
            
            self.logger.info(f"Starting PraisonAI Agents process for topic: {topic}")
            result = praison_ai_agents_instance.kickoff()
            self.logger.info(f"PraisonAI Agents process finished. Result: {result}")
            return result
        except Exception as e:
            self.logger.error(f"Error during PraisonAI Agents kickoff: {e}")
            raise 