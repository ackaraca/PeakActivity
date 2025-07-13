<template lang="pug">
div.activity-view-container
  draggable.row(v-model="elements" handle=".handle")
    div.col-md-6.col-lg-4.p-3(v-for="el, index in elements", :key="index", :class="{'col-md-12': isVisLarge(el), 'col-lg-12': isVisLarge(el)}")
      .card.h-100
        .card-body.p-0
          aw-selectable-vis(:id="index" :type="el.type" :props="el.props" @onTypeChange="onTypeChange" @onRemove="onRemove" :editable="editing")

    div.col-md-6.col-lg-4.p-3(v-if="editing")
      .card.h-100.d-flex.align-items-center.justify-content-center
        b-button(@click="addVisualization" variant="outline-primary" block size="lg")
          icon(name="plus")
          span.ml-2 Görselleştirme Ekle

  div(v-if="editing").mt-4.d-flex.justify-content-end
    b-button.mr-2(variant="danger" @click="discard(); editing = !editing;")
      icon(name="times")
      span İptal
    b-button(variant="success" @click="save(); editing = !editing;")
      icon(name="save")
      span Kaydet

  div(v-if="editing").mt-2.d-flex.justify-content-end
    b-button.mr-2(variant="outline-warning" size="sm" @click="restoreDefaults();")
      icon(name="undo")
      span Varsayılanları Geri Yükle
    b-button(variant="outline-danger" size="sm" @click="remove();")
      icon(name="trash")
      span Kaldır
  div(v-else).d-flex.justify-content-end.mt-4
    b-button(variant="outline-primary" size="sm" @click="editing = !editing")
      icon(name="edit")
      span Görünümü Düzenle
</template>

<script lang="ts">
import 'vue-awesome/icons/save';
import 'vue-awesome/icons/times';
import 'vue-awesome/icons/trash';
import 'vue-awesome/icons/undo';

import { mapState } from 'pinia';
import draggable from 'vuedraggable';

import { useViewsStore } from '~/stores/views';

export default {
  name: 'ActivityView',
  components: {
    draggable: draggable,
  },
  props: {
    view_id: { type: String, default: 'default' },
  },
  data() {
    return { editing: false };
  },
  computed: {
    ...mapState(useViewsStore, ['views']),
    view: function () {
      if (this.view_id == 'default') {
        return this.views[0];
      } else {
        return this.views.find(v => v.id == this.view_id);
      }
    },
    elements: {
      get() {
        return this.view.elements;
      },
      set(elements) {
        useViewsStore().setElements({ view_id: this.view.id, elements });
      },
    },
  },
  methods: {
    save() {
      useViewsStore().save();
    },
    discard() {
      useViewsStore().load();
    },
    remove() {
      useViewsStore().removeView({ view_id: this.view.id });
      // If we're on an URL that'll be invalid after removing the view, navigate to the main/default view
      if (!this.$route.path.includes('default')) {
        this.$router.replace('./default');
      }
    },
    restoreDefaults() {
      useViewsStore().restoreDefaults();
      alert(
        "All views have been restored to defaults. Changes won't be saved until you click 'Save'."
      );
      // If we're on an URL that might become invalid, navigate to the main/default view
      if (!this.$route.path.includes('default')) {
        this.$router.replace('./default');
      }
    },
    addVisualization: function () {
      useViewsStore().addVisualization({ view_id: this.view.id, type: 'top_apps' });
    },
    async onTypeChange(id, type) {
      let props = {};

      if (type === 'custom_vis') {
        const visname = prompt('Please enter the watcher name', 'aw-watcher-');
        if (!visname) return;

        const title = prompt('Please enter the visualization title');
        if (!title) return;

        props = {
          visname,
          title,
        };
      }

      await useViewsStore().editView({ view_id: this.view.id, el_id: id, type, props });
    },
    async onRemove(id) {
      await useViewsStore().removeVisualization({ view_id: this.view.id, el_id: id });
    },
    isVisLarge(el) {
      return el.type == 'sunburst_clock' || el.type == 'vis_timeline';
    },
  },
};
</script>

<style lang="scss" scoped>
@import '../../style/globals';

.activity-view-container {
  padding: 10px;
}

.card {
  background-color: var(--background-color);
  border: 1px solid var(--light-border-color);
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;

  .card-body {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }
}

.btn-outline-primary {
  color: var(--active-highlight-color);
  border-color: var(--active-highlight-color);
  &:hover {
    background-color: var(--active-highlight-color);
    color: white;
  }
}

.btn-danger {
  background-color: #dc3545;
  border-color: #dc3545;
  color: white;
  &:hover {
    background-color: darken(#dc3545, 10%);
    border-color: darken(#dc3545, 10%);
  }
}

.btn-success {
  background-color: #28a745;
  border-color: #28a745;
  color: white;
  &:hover {
    background-color: darken(#28a745, 10%);
    border-color: darken(#28a745, 10%);
  }
}

.btn-outline-warning {
  color: #ffc107;
  border-color: #ffc107;
  &:hover {
    background-color: #ffc107;
    color: white;
  }
}
</style>
