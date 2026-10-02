<template>
  <div class="library-section">
    <!-- Filters Bar -->
    <div class="filters-bar">

      <!-- ── Desktop: pills de estado ─── -->
      <div class="filter-tabs">
        <button
          v-for="tab in statusTabs"
          :key="tab.value"
          :class="['filter-tab', { active: activeFilter === tab.value }]"
          @click="activeFilter = tab.value"
        >
          <span>{{ tab.icon }}</span>
          <span>{{ tab.label }}</span>
          <span class="tab-count">{{ getCountForStatus(tab.value) }}</span>
        </button>
      </div>

      <!-- ── Móvil: fila compacta con select de estado + año + ordenación ─── -->
      <div class="filter-row-mobile">
        <select v-model="activeFilter" class="input-field filter-select-mobile">
          <option v-for="tab in statusTabs" :key="tab.value" :value="tab.value">
            {{ tab.icon }} {{ tab.label }} ({{ getCountForStatus(tab.value) }})
          </option>
        </select>

        <select v-model="selectedYear" class="input-field filter-select-mobile">
          <option value="all">📅 Año (Todos)</option>
          <option v-for="y in availableYears" :key="y" :value="y">{{ y }}</option>
        </select>

        <select v-model="sortBy" class="input-field filter-select-mobile">
          <option value="recent">⚡ Predeterminado</option>
          <option value="finish_date">🏁 Compleción</option>
          <option value="title">🔤 A-Z</option>
          <option value="rating">⭐ Puntuación</option>
          <option value="year">📅 Año lanzamiento</option>
        </select>

        <button
          class="btn-sort-order"
          @click="sortOrder = sortOrder === 'asc' ? 'desc' : 'asc'"
          :title="sortOrder === 'asc' ? 'Orden ascendente (clic para descendente)' : 'Orden descendente (clic para ascendente)'"
        >
          {{ sortOrder === 'asc' ? '↑' : '↓' }}
        </button>
      </div>

      <!-- ── Búsqueda + Filtros + Ordenación (desktop) ─── -->
      <div class="filter-controls">
        <div class="filter-search-wrapper">
          <input
            v-model="localSearch"
            type="text"
            class="input-field filter-search"
            placeholder="Filtrar por título..."
          />
          <button
            v-if="localSearch"
            class="clear-search-btn"
            @click="localSearch = ''"
            title="Limpiar búsqueda"
          >
            ✕
          </button>
        </div>

        <!-- Selector de Año -->
        <select v-model="selectedYear" class="input-field filter-select">
          <option value="all">📅 Todos los años</option>
          <option v-for="y in availableYears" :key="y" :value="y">{{ y }}</option>
        </select>

        <!-- Selector de Criterio de Ordenación -->
        <select v-model="sortBy" class="input-field filter-select">
          <option value="recent">⚡ Predeterminado (Pendientes + Recién completados)</option>
          <option value="finish_date">🏁 Fecha de compleción</option>
          <option value="title">Título A-Z</option>
          <option value="rating">Mejor valorados</option>
          <option value="year">Año de lanzamiento</option>
        </select>

        <button
          class="btn-sort-order"
          @click="sortOrder = sortOrder === 'asc' ? 'desc' : 'asc'"
          :title="sortOrder === 'asc' ? 'Orden ascendente (clic para descendente)' : 'Orden descendente (clic para ascendente)'"
        >
          {{ sortOrder === 'asc' ? '↑' : '↓' }}
        </button>
      </div>

      <!-- ── Búsqueda en móvil ─── -->
      <div class="filter-search-wrapper-mobile">
        <input
          v-model="localSearch"
          type="text"
          class="input-field filter-search-mobile"
          placeholder="🔍 Filtrar por título..."
        />
        <button
          v-if="localSearch"
          class="clear-search-btn"
          @click="localSearch = ''"
          title="Limpiar búsqueda"
        >
          ✕
        </button>
      </div>
    </div>

    <!-- Grid -->
    <TransitionGroup name="grid" tag="div" class="library-grid">
      <div
        v-for="item in displayedItems"
        :key="item.id"
        :class="['card', 'game-card', { 'is-masterpiece': item.rating === 5 }]"
      >
        <!-- Cover -->
        <div
          class="card-cover-wrapper"
          :class="{
            'has-switch2-banner': isSwitch2(item.platform),
            'has-nds-spine': isNDS(item.platform),
            'has-3ds-spine': is3DS(item.platform),
            'has-wii-banner': isWii(item.platform)
          }"
        >
          <!-- Physical Box Art Banner for Nintendo Switch 2 -->
          <div v-if="isSwitch2(item.platform)" class="box-art-header header-switch2" title="Nintendo Switch 2">
            <svg class="ns2-banner-logo-svg" viewBox="0 -1.799 540.1 466.3">
              <path fill="#ffffff" d="m31.3 340.101 19.7 26.6h7.8v-39.7h-8.1v26.1l-19.5-26.1h-8v39.7h8.1zm193.9-13.2h-33.7v8.4h12.7v31.4h8.5v-31.3h12.4zm-2.4 135h16.7v-75h-16.7zm-87.1-121.8 19.7 26.6h7.8v-39.7h-8.1v26.1l-19.5-26.1h-8v39.7h8.1zm37.7 101.2-15.9-54.4h-13.3l-15.8 54.2-14.4-54.2h-16.3l21.2 75h18l14-49.4 13.9 49.4h18.1l21.3-75h-16.3zm-119.1-24.9c-10.8-1.8-17.8-3.8-17.8-8.8 0-5.8 7.8-8.1 18.2-8.1 9.7 0 19.5 3.7 22.9 5.2l5.3-13c-3.8-1.5-15.7-5.8-29-5.8-16.2 0-33.4 7.9-33.4 22.5 0 11.9 8.4 17.9 29.9 21.6 15.1 2.6 23.5 4 23.3 10.6-.1 3.6-2.9 9.6-20 9.6-13.7 0-23.4-5-26.8-7l-7.1 12.8c3.8 2 16.5 7.9 32.8 7.9 23.8 0 36.4-8.3 36.4-23.9.1-9-3-18.4-34.7-23.6m43.4-89.5h-8.8v39.7h8.8zm256 39.7v-39.7h-8v26.1l-19.5-26.1h-8v39.7h8.1v-26.6l19.7 26.6zm-68.5-7.3h-22.8v-9.3h21.1v-7.2h-21.1v-8.6h22.8v-7.3h-30.9v39.7h30.9zm185.8-33.7c-11.7 0-21.2 9.5-21.2 21.2s9.5 21.2 21.2 21.2 21.2-9.5 21.2-21.2-9.5-21.2-21.2-21.2m0 33.6c-6.8 0-12.3-5.5-12.3-12.4 0-6.8 5.5-12.4 12.3-12.4s12.3 5.5 12.3 12.4c.1 6.8-5.5 12.4-12.3 12.4m2.7 57.3h-35v-29.5h-15.5v75h15.5v-29.9h35v29.9h15.5v-75h-15.5zm-216-13.6h23.9v59.1h16.1v-59.1h23.4v-15.9h-63.4zm115.6-1.7c8.5 0 16.3 4.5 20.6 11.6l12.2-10.6c-7.5-11.1-19.8-17.7-33.2-17.7-22 0-40 17.9-40 40s18 40 40 40c13.4 0 25.8-6.6 33.2-17.7l-12.2-10.6c-4.2 7.1-12.1 11.6-20.6 11.6-13.1 0-23.8-10.5-23.8-23.3s10.7-23.3 23.8-23.3m30.4-74.3h-16.4v39.7h16.4c11.3 0 20.4-8.9 20.4-19.9s-9.1-19.8-20.4-19.8m.4 31.4h-8.7v-23h8.7c6.4 0 11.5 5.2 11.5 11.5.1 6.4-5.1 11.5-11.5 11.5m-277-354.1h-58.5c-37.9 0-68.6 30.7-68.6 68.6v130.4c0 37.9 30.7 68.6 68.6 68.6h58.5c1.1 0 2-.9 2-2v-263.6c0-1.1-.8-2-2-2zm-19.6 246.1h-38.9c-12.6 0-24.4-4.9-33.3-13.8s-13.8-20.7-13.8-33.3v-130.3c0-12.6 4.9-24.4 13.8-33.3s20.7-13.8 33.3-13.8h38.9zm-40.7-190.9c13.9 0 25.2 11.3 25.2 25.2s-11.2 25.1-25.2 25.1c-13.9 0-25.1-11.3-25.1-25.2 0-13.8 11.3-25.1 25.1-25.1zm132.2-55.2h-41.4c-1 0-1.7.8-1.7 1.8v264c0 1.1.9 2 1.9 2h41.2c37.9 0 68.6-30.7 68.6-68.6v-130.5c.1-37.9-30.7-68.6-68.6-68.7zm9.8 174.3c-15 0-27.1-12.1-27.1-27.1 0-14.9 12.1-27.1 27.1-27.1 14.9 0 27.1 12.1 27.1 27.1s-12.1 27.1-27.1-27.1zm104 93.4v-46c4.8-3.9 22.7-19.4 41.7-35.7 17.1-14.7 34.2-29.5 51.6-43.8 13.1-10.8 38.1-30.6 38.8-50 .9-22.8-15.3-37.6-39.4-37.6-14.4 0-31.3 8-41.6 16.7s-23.4 20-23.4 20l-37.9-41.1c32.2-36.1 66.8-54.3 102.8-54.3 76.8-1.9 134.7 83.7 76.3 150.8-21.2 23.4-45.3 45.3-70 64.7h100.3v56.3z"/>
            </svg>
          </div>

          <!-- Physical Box Art Corner Badge for Nintendo Switch 1 (Top-left red square block) -->
          <div v-else-if="isSwitch1(item.platform)" class="box-art-header header-switch1" title="Nintendo Switch">
            <svg class="ns1-badge-logo-svg" viewBox="0 0 283.5 283.5">
              <rect fill="#E60012" width="283.5" height="283.5"/>
              <path fill="#FFFFFF" d="M128.4,241.6h6.7v-30h-6.7V241.6z M93.6,192.8l7.9,10.6h3.1v-15.9h-3.2V198l-7.8-10.4h-3.2v15.9h3.2V192.8z M129.4,187.5h-13.5v3.4h5.1v12.5h3.4v-12.5h5V187.5z M108.7,233.3l-6.4-21.8H97l-6.3,21.7l-5.8-21.7h-6.5l8.5,30h7.2l5.6-19.8l5.6,19.8h7.2l8.5-30h-6.5L108.7,233.3z M153.8,168.1h19.6c18,0,32.6-14.6,32.6-32.6v-62c0-18-14.6-32.6-32.6-32.6h-19.7c-0.5,0-0.8,0.4-0.8,0.8v125.5C152.9,167.7,153.3,168.1,153.8,168.1z M178,98c7.1,0,12.9,5.8,12.9,12.9c0,7.1-5.8,12.9-12.9,12.9c-7.1,0-12.9-5.8-12.9-12.9C165.2,103.8,170.9,98,178,98z M78.4,187.5h-3.5v15.9h3.5V187.5z M51.8,192.8l7.9,10.6h3.1v-15.9h-3.2V198l-7.8-10.4h-3.2v15.9h3.2V192.8z M61.2,223.4l-0.2,0c-3.7-0.6-6.8-1.2-7.1-3.3c0-0.3,0-1,0.5-1.7c1-1.2,3.3-1.7,6.7-1.7c3.9,0,7.8,1.5,9.2,2.1l2.1-5.2c-1.5-0.6-6.3-2.3-11.6-2.3c-6.5,0-13.4,3.2-13.4,9c0,4.7,3.3,7.2,11.9,8.7c6.1,1,9.4,1.6,9.3,4.2c-0.1,1.4-1.2,3.8-8,3.8c-5.5,0-9.4-2-10.7-2.8l-2.8,5.1c1.5,0.8,6.6,3.2,13.1,3.2c9.5,0,14.6-3.3,14.6-9.6C74.9,228.4,72.7,225.4,61.2,223.4z M98.6,79.1c0,6.6,5.4,12,12,12c6.6,0,12-5.4,12-12c0-6.6-5.4-12-12-12C103.9,67.1,98.6,72.4,98.6,79.1z M153.4,200.5h-9.1v-3.7h8.4v-2.9h-8.4v-3.4h9.1v-2.9l-12.4,0v15.9l12.4,0V200.5z M227.8,187c-4.7,0-8.5,3.8-8.5,8.5c0,4.7,3.8,8.5,8.5,8.5c4.7,0,8.5-3.8,8.5-8.5C236.2,190.8,232.4,187,227.8,187z M227.8,200.4c-2.7,0-4.9-2.2-4.9-4.9c0-2.7,2.2-4.9,4.9-4.9c2.7,0,4.9,2.2,4.9,4.9C232.7,198.2,230.5,200.4,227.8,200.4z M228.8,223.4h-14v-11.8h-6.2v30h6.2v-12h14v12h6.2v-30h-6.2V223.4z M237.5,238.5h1.3v3.1h0.7v-3.1h1.2v-0.7h-3.2V238.5z M244.4,237.7l-1,2.8l-1-2.8h-1.1v3.8h0.7v-2.9l1,2.9l0,0h0.7l0,0l1-2.9v2.9h0.7v-3.8H244.4z M188.7,217.3c3.4,0,6.5,1.8,8.2,4.7l4.9-4.2c-3-4.4-7.9-7.1-13.3-7.1c-8.8,0-16,7.2-16,16c0,8.8,7.2,16,16,16c5.4,0,10.3-2.6,13.3-7.1l-4.9-4.2c-1.7,2.8-4.8,4.7-8.2,4.7c-5.2,0-9.5-4.2-9.5-9.3S183.4,217.3,188.7,217.3z M142.4,217.9h9.6v23.6h6.5v-23.6h9.4v-6.4h-25.4V217.9z M180.8,203.4v-15.9h-3.2V198l-7.8-10.4h-3.2v15.9h3.2v-10.6l7.9,10.6H180.8z M139.2,40.9h-27.8c-18,0-32.6,14.6-32.6,32.6v62c0,18,14.6,32.6,32.6,32.6h27.8c0.5,0,0.9-0.4,0.9-0.9V41.8C140.1,41.3,139.7,40.9,139.2,40.9z M129.9,157.9h-18.5c-6,0-11.6-2.3-15.8-6.6c-4.2-4.2-6.6-9.8-6.6-15.8v-62c0-6,2.3-11.6,6.6-15.8c4.2-4.2,9.8-6.6,15.8-6.6h18.5V157.9z M200.8,187.5h-6.6v15.9h6.6c4.5,0,8.2-3.6,8.2-7.9C209,191.1,205.3,187.5,200.8,187.5z M201,200.1h-3.5v-9.2h3.5c2.5,0,4.6,2.1,4.6,4.6C205.6,198,203.5,200.1,201,200.1z"/>
            </svg>
          </div>

          <!-- Physical Box Art Side-Bar for Nintendo DS (Left vertical white stripe) -->
          <div v-else-if="isNDS(item.platform)" class="box-art-header header-ds" title="Nintendo DS">
            <svg class="nds-spine-logo" viewBox="0 0 219.8 30.6">
              <g>
                <path fill="#8C8C8C" fill-rule="evenodd" clip-rule="evenodd" d="M136.1,27.6c0,0.3-0.3,0.6-0.6,0.6h-11.4c-0.3,0-0.6-0.3-0.6-0.6v-8.2c0-0.3,0.3-0.6,0.6-0.6h11.4c0.3,0,0.6,0.3,0.6,0.6V27.6 M135.6,16.3H124c-1.7,0-3,1.4-3,3.1v8.3c0,1.7,1.4,3,3,3h11.6c1.7,0,3-1.4,3-3v-8.3C138.7,17.6,137.3,16.3,135.6,16.3z"/>
                <path fill="#333333" fill-rule="evenodd" clip-rule="evenodd" d="M0,0.2c0.1,0,2.2,0,2.3,0L13,10.6c0,0,0-10.3,0-10.5c0.1,0,2.1,0,2.1,0s0.4,0,0.5,0c0,0.2,0,14.2,0,14.4c-0.1,0-2,0-2.1,0L2.7,3.9c0,0,0,10.5,0,10.6c-0.1,0-2.5,0-2.7,0C0,14.4,0,0.3,0,0.2"/>
                <path fill="#333333" fill-rule="evenodd" clip-rule="evenodd" d="M29.3,3.9c0,0,0,10.5,0,10.6c-0.1,0-2.5,0-2.7,0c0-0.2,0-14.2,0-14.4c0.1,0,2.2,0,2.3,0l10.8,10.5c0,0,0-10.3,0-10.5c0.2,0,2.1,0,2.1,0s0.4,0,0.5,0c0,0.2,0,14.2,0,14.4c-0.1,0-2,0-2.1,0L29.3,3.9"/>
                <path fill="#333333" fill-rule="evenodd" clip-rule="evenodd" d="M84.6,3.9c0,0,0,10.5,0,10.6c-0.1,0-2.5,0-2.7,0c0-0.2,0-14.2,0-14.4c0.1,0,2.2,0,2.3,0L95,10.6c0,0,0-10.3,0-10.5c0.1,0,2.1,0,2.1,0s0.4,0,0.5,0c0,0.2,0,14.2,0,14.4c-0.2,0-2,0-2.1,0L84.6,3.9"/>
                <path fill="#333333" fill-rule="evenodd" clip-rule="evenodd" d="M22,0.2c0,0,0.4,0,0.5,0c0,0.2,0,14.2,0,14.4c-0.1,0-2.5,0-2.7,0c0-0.2,0-14.2,0-14.4C20,0.2,22,0.2,22,0.2"/>
                <path fill="#333333" fill-rule="evenodd" clip-rule="evenodd" d="M60.4,0.2c0,0,0.4,0,0.5,0c0,0.1,0,2.3,0,2.5c-0.2,0-6.4,0-6.4,0s0,11.7,0,11.9c-0.1,0-2.6,0-2.8,0c0-0.2,0-11.9,0-11.9s-6.3,0-6.4,0c0-0.1,0-2.3,0-2.5C45.5,0.2,60.4,0.2,60.4,0.2"/>
                <path fill="#333333" fill-rule="evenodd" clip-rule="evenodd" d="M77.5,0.2c0,0,0.4,0,0.5,0c0,0.1,0,2.3,0,2.5c-0.2,0-11.4,0-11.4,0l0,3.2c0,0,8.7,0,8.8,0c0,0.1,0,2.3,0,2.5c-0.2,0-8.8,0-8.8,0l0,3.7c0,0,11.3,0,11.4,0c0,0.1,0,2.3,0,2.5c-0.2,0-13.9,0-14,0c0-0.2,0-14.2,0-14.4C64.1,0.2,77.5,0.2,77.5,0.2"/>
                <path fill="#333333" fill-rule="evenodd" clip-rule="evenodd" d="M112.4,12.1h-8.2V2.6h8.2c2.6,0,3.5,2.5,3.5,4.7C115.9,9.5,114.9,12.1,112.4,12.1 M116.8,2.3c-1-1.4-2.6-2.1-4.4-2.1c0,0-10.5,0-10.7,0c0,0.2,0,14.2,0,14.4c0.2,0,10.7,0,10.7,0c1.9,0,3.4-0.7,4.4-2.1c1-1.3,1.5-3,1.5-5.1C118.2,5.3,117.7,3.5,116.8,2.3z"/>
                <path fill="#333333" fill-rule="evenodd" clip-rule="evenodd" d="M136.1,11.5c0,0.3-0.3,0.6-0.6,0.6h-11.4c-0.3,0-0.6-0.3-0.6-0.6V3.2c0-0.3,0.3-0.6,0.6-0.6h11.4c0.3,0,0.6,0.3,0.6,0.6V11.5 M135.6,0.2H124c-1.7,0-3,1.4-3,3.1v8.3c0,1.7,1.4,3,3,3h11.6c1.7,0,3-1.4,3-3V3.2C138.7,1.5,137.3,0.2,135.6,0.2z"/>
                <path fill="#333333" fill-rule="evenodd" clip-rule="evenodd" d="M184,24.6c2.8,1.1,8.6,2,13.1,2c5,0,7-1.7,7-3.8c0-1.9-1.9-3.1-7.4-5.1c-7.3-2.7-12.7-4.9-12.7-9.7c0-5,6.5-7.9,16.4-7.9c5.3,0,7.1,0.3,10.5,1l0,4.7c-3.3-0.6-6.2-1.7-10.8-1.7c-4.9,0-7,1.6-7,3.2c0,2.3,3.2,3.4,8.8,5.4c7.8,2.8,12.2,5,12.2,9.7c0,4.9-5.5,8.4-17.8,8.4c-5.1,0-8.5-0.3-12.4-1V24.6"/>
                <path fill="#333333" fill-rule="evenodd" clip-rule="evenodd" d="M157.8,4.2h-5.9v22.2h5.9c9,0,14.7-3.8,14.7-11C172.4,8.1,166.8,4.2,157.8,4.2 M173.5,28.4c-2.9,1.3-8.4,2.1-13.2,2.1H142V0.1h18.3c4.8,0,10.3,0.8,13.2,2.2c7,3.2,9.3,8.3,9.3,13.1C182.8,20.1,180.6,25.2,173.5,28.4z"/>
                <polyline fill="#333333" points="215.7,30.2 215.1,30.2 215.1,27.8 214.2,27.8 214.2,27.3 216.5,27.3 216.5,27.8 215.7,27.8 215.7,30.2"/>
                <polyline fill="#333333" points="219.8,30.2 219.3,30.2 219.3,27.8 219.3,27.8 218.7,30.2 218.2,30.2 217.6,27.8 217.6,27.8 217.6,30.2 217.1,30.2 217.1,27.3 217.9,27.3 218.4,29.6 218.5,29.6 219,27.3 219.8,27.3 219.8,30.2"/>
              </g>
            </svg>
          </div>

          <!-- Physical Box Art Side-Bar for Nintendo 3DS (Right vertical white stripe) -->
          <div v-else-if="is3DS(item.platform)" class="box-art-header header-3ds" title="Nintendo 3DS">
            <svg class="n3ds-spine-logo" viewBox="0 0 132 15.6">
              <g>
                <path d="M128.7,13.5h0.5V15h0.3v-1.5h0.5v-0.3h-1.3V13.5z M131.9,13.2h-0.4l-0.2,0.7c-0.1,0.2-0.1,0.4-0.2,0.6h0c0-0.2-0.1-0.4-0.2-0.6l-0.2-0.7h-0.4l-0.1,1.7h0.3l0-0.7c0-0.2,0-0.5,0-0.7h0c0,0.2,0.1,0.4,0.2,0.7l0.2,0.7h0.2l0.2-0.7c0.1-0.2,0.2-0.4,0.2-0.7h0c0,0.2,0,0.5,0,0.7l0,0.7h0.3L131.9,13.2z" fill="#222222"/>
                <path fill="#8C8C8C" d="M68.7,8.3h-5.9c-0.8,0-1.5,0.7-1.5,1.5V14c0,0.8,0.7,1.5,1.5,1.5h5.9c0.8,0,1.5-0.7,1.5-1.5V9.8C70.3,9,69.6,8.3,68.7,8.3 M69,14c0,0.2-0.1,0.3-0.3,0.3h-5.8c-0.2,0-0.3-0.1-0.3-0.3V9.8c0-0.2,0.1-0.3,0.3-0.3h5.8c0.2,0,0.3,0.1,0.3,0.3V14z"/>
                <path fill="#222222" d="M23,1.4h3.2v6h1.4v-6h3.2V0.1H23V1.4z M20.1,5.4l-5.5-5.3h-1.1v7.3h1.3V2l5.5,5.4h1.1V0.1h-1.3V5.4z M10,7.4h1.4V0.1H10V7.4z M6.6,5.4L1.2,0.1H0v7.3h1.3V2l5.5,5.4h1.1V0.1H6.6V5.4z M32.4,7.4h7.1V6.1h-5.8V4.3h4.5V3h-4.5V1.4h5.8V0.1h-7.1V7.4z M48.1,5.4l-5.5-5.3h-1.2v7.3h1.3V2l5.5,5.4h1.1V0.1h-1.3V5.4z M121.6,6.4c-2.9-1-4.5-1.6-4.5-2.8c0-0.8,1.1-1.6,3.5-1.6c2.3,0,3.8,0.5,5.5,0.9l0-2.4c-1.7-0.3-2.6-0.5-5.3-0.5c-5,0-8.3,1.5-8.3,4c0,2.4,2.7,3.5,6.5,4.9c2.8,1,3.8,1.6,3.8,2.6c0,1.1-1,2-3.6,2c-2.3,0-5.2-0.4-6.7-1v2.6c2,0.3,3.7,0.5,6.3,0.5c6.2,0,9-1.8,9-4.2C127.8,8.9,125.6,7.8,121.6,6.4z M107.2,1.2c-1.5-0.7-4.2-1.1-6.7-1.1h-9.3v15.5h9.3c2.4,0,5.2-0.4,6.7-1.1c3.6-1.6,4.7-4.2,4.7-6.6C112,5.4,110.8,2.8,107.2,1.2z M99.3,13.4h-3V2.2h3c4.6,0,7.4,2,7.4,5.6C106.7,11.5,103.8,13.4,99.3,13.4z M56.9,0.1h-5.4v7.3h5.4c0.9,0,1.7-0.4,2.3-1.1c0.5-0.6,0.8-1.5,0.8-2.6c0-1-0.3-1.9-0.8-2.6C58.6,0.5,57.9,0.1,56.9,0.1z M57,6.1h-4.1V1.4H57c1.3,0,1.8,1.3,1.8,2.4C58.7,4.9,58.2,6.1,57,6.1z M68.7,0.1h-5.9c-0.8,0-1.5,0.7-1.5,1.5v4.2c0,0.8,0.7,1.5,1.5,1.5h5.9c0.8,0,1.5-0.7,1.5-1.5V1.7C70.3,0.8,69.6,0.1,68.7,0.1z M69,5.9c0,0.2-0.1,0.3-0.3,0.3h-5.8c-0.2,0-0.3-0.1-0.3-0.3V1.7c0-0.2,0.1-0.3,0.3-0.3h5.8c0.2,0,0.3,0.1,0.3,0.3V5.9z"/>
                <path fill="#CE181E" d="M84.8,7.1c0,0,4.3-0.7,4.3-3.4c0-2.6-4.6-3.7-9.5-3.7c-4.4,0-7.3,0.5-7.3,0.5v2.4c2-0.5,3.9-0.9,6.5-0.9c2.8,0,4.9,0.8,4.9,2c0,1.4-2.1,2.2-6.7,2.2H75v2.2h2c4.8,0,7.5,0.7,7.5,2.5c0,1.6-2.4,2.5-5.5,2.5c-2.7,0-5.1-0.6-7-1.1v2.6c1,0.2,3.5,0.7,8.1,0.7c5.2,0,9.7-1.7,9.7-4.6C89.8,8.5,86.6,7.1,84.8,7.1"/>
              </g>
            </svg>
          </div>

          <!-- Physical Box Art Banner for Nintendo Wii (Top white curved banner) -->
          <div v-else-if="isWii(item.platform)" class="box-art-header header-wii" title="Nintendo Wii">
            <svg class="wii-header-bg-svg" viewBox="0 0 200 52" preserveAspectRatio="none">
              <!-- Official Wii curved header shape: flat bottom y=40 from x=165 to 200 -->
              <path fill="#ffffff" d="M 0 0 L 200 0 L 200 50 L 162 50 C 132 46 148 8 73 8 L 0 8 Z" />
              <!-- Bottom curved separator line (only tracing the bottom edge) -->
              <path fill="none" stroke="#d1d5db" stroke-width="1.2" d="M 0 0 L 200 0 L 200 50 L 162 50 C 132 46 148 8 73 8 L 0 8 Z" />
            </svg>
            <svg class="wii-banner-logo" viewBox="0 0 204.4 89.9">
              <g>
                <path fill="#8C8C8C" d="M129.6,10.2c0,5.6,4.8,10.2,10.6,10.2c6.1,0,10.8-4.5,10.8-10.2c0-5.7-4.8-10.2-10.8-10.2C134.4,0,129.6,4.6,129.6,10.2"/>
                <rect x="131.4" y="30.7" fill="#8C8C8C" width="18.1" height="58.5"/>
                <path fill="#8C8C8C" d="M166.4,10.2c0,5.6,4.8,10.2,10.6,10.2c6.1,0,10.8-4.5,10.8-10.2C187.8,4.5,183.1,0,177,0C171.2,0,166.4,4.6,166.4,10.2"/>
                <rect x="168.2" y="30.7" fill="#8C8C8C" width="18.1" height="58.5"/>
                <path fill="#8C8C8C" d="M102.6,4.9L86.8,67.1c0,0-12.1-46.7-14.1-53.3c-2-6.6-6-9.5-11.8-9.5c-5.8,0-9.8,2.9-11.8,9.5C47.1,20.4,35,67.1,35,67.1L19.1,4.9H0c0,0,18.3,66.3,20.8,74c1.9,6,6.5,10.9,13.4,10.9c7.8,0,11.4-5.7,13.1-10.9c1.7-5.2,13.6-49,13.6-49s11.9,43.8,13.6,49c1.7,5.2,5.3,10.9,13.1,10.9c6.8,0,11.4-4.9,13.4-10.9c2.5-7.7,20.8-74,20.8-74H102.6z"/>
                <path fill="#8C8C8C" d="M194.9,83.5H193v-0.7h4.6v0.7h-1.9v5.7h-0.8V83.5z"/>
                <path fill="#8C8C8C" d="M203.4,86.4c0-0.9-0.1-2-0.1-2.8h0c-0.2,0.7-0.5,1.6-0.8,2.4l-1.1,3.1h-0.6l-1-3.1c-0.3-0.9-0.5-1.7-0.7-2.5h0c0,0.8-0.1,1.9-0.1,2.8l-0.2,2.8h-0.8l0.4-6.4h1l1.1,3.1c0.3,0.8,0.5,1.5,0.6,2.2h0c0.2-0.6,0.4-1.4,0.7-2.2l1.1-3.1h1l0.4,6.4h-0.8L203.4,86.4z"/>
              </g>
            </svg>
          </div>

          <img
            v-if="item.game.cover_url"
            :src="item.game.cover_url"
            :alt="item.game.title"
            class="card-cover"
            loading="lazy"
          />
          <div v-else class="card-cover-placeholder">🎮</div>
          <span :class="['badge', `badge-${statusCss(item.status)}`]" class="card-badge">
            <span>{{ statusIcon(item.status) }}</span>
            <span>{{ item.status }}</span>
          </span>
          <!-- Replay / Run badge -->
          <span v-if="getRunBadgeInfo(item)" class="badge run-badge" :title="`Tienes ${getRunBadgeInfo(item)?.totalCount} partida(s) registrada(s) de este juego`">
            🔁 {{ getRunBadgeInfo(item)?.badgeText }}
          </span>
        </div>

        <!-- Info -->
        <div class="card-info">
          <h3 class="card-title">{{ item.game.title }}</h3>
          <p class="card-meta">
            <span>{{ formatPlatformLabel(item.platform) }}</span>
            <span v-if="item.game.release_year"> · {{ item.game.release_year }}</span>
          </p>
          <p v-if="item.finish_date" class="finish-date-row" title="Fecha de compleción">
            🏁 <span class="finish-date-tag">{{ formatDateShort(item.finish_date) }}</span>
          </p>

          <!-- Stars -->
          <div v-if="item.rating" class="card-rating" :title="`${item.rating}/5 — ${getRatingLabel(item.rating)}`">
            <span v-for="s in 5" :key="s" :class="['star-small', { filled: s <= item.rating }]" :title="`${s} - ${getRatingLabel(s)}`">★</span>
          </div>

          <!-- Lent to badge -->
          <div v-if="item.status === 'Prestado' && item.lent_to" class="lent-info">
            🤝 {{ item.lent_to }}
          </div>
        </div>

        <!-- Actions -->
        <div class="card-actions">
          <button class="action-btn replay-btn" title="Registrar otra partida / rejugada" @click="openNewRun(item)">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
            </svg>
          </button>
          <button class="action-btn edit-btn" title="Editar partida" @click="openEdit(item)">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button class="action-btn delete-btn" title="Eliminar partida" @click="deleteItem(item.id)">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
            </svg>
          </button>
        </div>
      </div>
    </TransitionGroup>

    <!-- Infinite Scroll Sentinel / Load More Indicator -->
    <div ref="scrollSentinel" class="scroll-sentinel">
      <div v-if="hasMore" class="loading-more" @click="loadMore" title="Haz clic para cargar más manualmente">
        <span class="spinner">⏳</span>
        <span>Cargando más juegos... ({{ displayedItems.length }} de {{ filteredItems.length }})</span>
      </div>
      <div v-else-if="filteredItems.length > BATCH_SIZE" class="end-of-list">
        <span>✓ Se han cargado todos los juegos ({{ filteredItems.length }})</span>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="filteredItems.length === 0 && !loading" class="empty-state">
      <span style="font-size: 3rem;">📚</span>
      <h3>No se encontraron juegos</h3>
      <p v-if="selectedYear !== 'all' && activeFilter !== 'all'">No tienes juegos en estado "{{ activeFilter }}" para el año {{ selectedYear }}.</p>
      <p v-else-if="selectedYear !== 'all'">No tienes juegos registrados para el año {{ selectedYear }}.</p>
      <p v-else-if="activeFilter !== 'all'">No tienes juegos con estado "{{ activeFilter }}".</p>
      <p v-else>Usa el buscador de arriba para encontrar y añadir videojuegos.</p>
    </div>

    <!-- Edit Modal -->
    <AddGameModal
      v-if="editingItem"
      :game="editingItem.game"
      :existing-item="editingItem"
      @close="editingItem = null"
      @updated="handleUpdated"
    />

    <!-- Add New Run Modal -->
    <AddGameModal
      v-if="addingNewRunGame"
      :game="addingNewRunGame"
      @close="addingNewRunGame = null"
      @added="handleNewRunAdded"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { supabase, getLibraryItems, deleteLibraryItemFromDB } from '../lib/supabase';
import { formatPlatformLabel } from '../lib/platforms';
import type { User } from '@supabase/supabase-js';
import AddGameModal from './AddGameModal.vue';

interface LibraryItem {
  id: string;
  game: {
    igdb_id: number;
    title: string;
    cover_url: string | null;
    release_year: number | null;
    genres: string[];
    developers: string[];
    steam_appid: number | null;
  };
  platform: string;
  status: string;
  start_date: string | null;
  finish_date: string | null;
  playtime_hours: number;
  rating: number | null;
  lent_to: string | null;
  notes: string | null;
  created_at: string;
}

const BATCH_SIZE = 12;

const items = ref<LibraryItem[]>([]);
const activeFilter = ref('all');
const localSearch = ref('');
const selectedYear = ref<string>('all');
const sortBy = ref('recent');
const sortOrder = ref<'asc' | 'desc'>('desc');
const currentUser = ref<User | null>(null);
const loading = ref(true);
const editingItem = ref<any>(null);

// Pagination / Infinite Scroll state
const visibleCount = ref(BATCH_SIZE);
const scrollSentinel = ref<HTMLElement | null>(null);
let observer: IntersectionObserver | null = null;

const statusTabs = [
  { value: 'all', label: 'Todos', icon: '📚' },
  { value: 'Pendiente', label: 'Pendientes', icon: '⏳' },
  { value: 'En curso', label: 'En curso', icon: '🎮' },
  { value: 'Jugado', label: 'Jugados', icon: '✅' },
  { value: 'Abandonado', label: 'Abandonados', icon: '❌' },
  { value: 'Prestado', label: 'Prestados', icon: '🤝' },
];

function isSwitch2(platformKey?: string | null): boolean {
  if (!platformKey) return false;
  const label = formatPlatformLabel(platformKey).toLowerCase();
  const raw = platformKey.toLowerCase();
  return label.includes('switch 2') || raw.includes('switch 2') || raw === 'switch-2' || raw === 'ns2';
}

function isSwitch1(platformKey?: string | null): boolean {
  if (!platformKey) return false;
  if (isSwitch2(platformKey)) return false;
  const label = formatPlatformLabel(platformKey).toLowerCase();
  const raw = platformKey.toLowerCase();
  return label.includes('switch') || raw.includes('switch');
}

function is3DS(platformKey?: string | null): boolean {
  if (!platformKey) return false;
  const label = formatPlatformLabel(platformKey).toLowerCase();
  const raw = platformKey.toLowerCase();
  return label.includes('3ds') || raw.includes('3ds');
}

function isNDS(platformKey?: string | null): boolean {
  if (!platformKey) return false;
  if (is3DS(platformKey)) return false;
  const label = formatPlatformLabel(platformKey).toLowerCase();
  const raw = platformKey.toLowerCase();
  return label.includes('ds') || raw === 'nds' || raw.includes('game boy') || raw.includes('gameboy');
}

function isWii(platformKey?: string | null): boolean {
  if (!platformKey) return false;
  const label = formatPlatformLabel(platformKey).toLowerCase();
  const raw = platformKey.toLowerCase();
  return label.includes('wii') || raw.includes('wii');
}

function statusCss(status: string): string {
  const map: Record<string, string> = {
    'Pendiente': 'pendiente',
    'En curso': 'en-curso',
    'Jugado': 'jugado',
    'Abandonado': 'abandonado',
    'Prestado': 'prestado',
  };
  return map[status] || 'pendiente';
}

function statusIcon(status: string): string {
  const map: Record<string, string> = {
    'Pendiente': '⏳',
    'En curso': '🎮',
    'Jugado': '✅',
    'Abandonado': '❌',
    'Prestado': '🤝',
  };
  return map[status] || '';
}

function getCountForStatus(status: string): number {
  if (status === 'all') return items.value.length;
  return items.value.filter(i => i.status === status).length;
}

function formatDateShort(str?: string | null): string {
  if (!str) return '';
  try {
    const parts = str.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return str;
  } catch {
    return str;
  }
}

function getStatusPriority(status: string): number {
  if (status === 'En curso') return 1;
  if (status === 'Pendiente') return 2;
  if (status === 'Jugado') return 3;
  if (status === 'Prestado') return 4;
  if (status === 'Abandonado') return 5;
  return 6;
}

// Extract distinct years present in user's library (release years & completion years)
const availableYears = computed(() => {
  const yearsSet = new Set<number>();
  items.value.forEach(item => {
    if (item.game.release_year) yearsSet.add(item.game.release_year);
    if (item.finish_date) {
      const y = new Date(item.finish_date).getFullYear();
      if (!isNaN(y)) yearsSet.add(y);
    }
  });
  return Array.from(yearsSet).sort((a, b) => b - a);
});

const filteredItems = computed(() => {
  let result = [...items.value];

  // Filter by status
  if (activeFilter.value !== 'all') {
    result = result.filter(i => i.status === activeFilter.value);
  }

  // Filter by year (release year or completion year)
  if (selectedYear.value !== 'all') {
    const targetY = parseInt(selectedYear.value, 10);
    result = result.filter(i => {
      const relY = i.game.release_year;
      const finY = i.finish_date ? new Date(i.finish_date).getFullYear() : null;
      return relY === targetY || finY === targetY;
    });
  }

  // Filter by local search
  if (localSearch.value.trim()) {
    const q = localSearch.value.toLowerCase();
    result = result.filter(i => i.game.title.toLowerCase().includes(q));
  }

  // Sort
  const isAsc = sortOrder.value === 'asc';

  switch (sortBy.value) {
    case 'finish_date':
      result.sort((a, b) => {
        const timeA = a.finish_date ? new Date(a.finish_date).getTime() : (isAsc ? Infinity : -Infinity);
        const timeB = b.finish_date ? new Date(b.finish_date).getTime() : (isAsc ? Infinity : -Infinity);
        return isAsc ? timeA - timeB : timeB - timeA;
      });
      break;
    case 'title':
      result.sort((a, b) => isAsc ? a.game.title.localeCompare(b.game.title) : b.game.title.localeCompare(a.game.title));
      break;
    case 'rating':
      result.sort((a, b) => isAsc ? (a.rating || 0) - (b.rating || 0) : (b.rating || 0) - (a.rating || 0));
      break;
    case 'year':
      result.sort((a, b) => isAsc ? (a.game.release_year || 0) - (b.game.release_year || 0) : (b.game.release_year || 0) - (a.game.release_year || 0));
      break;
    case 'recent':
    default:
      // Default order:
      // 1. En curso / Pendientes first
      // 2. Jugados ordered by finish_date descending (most recently completed first)
      // 3. Other statuses ordered by created_at / finish_date
      result.sort((a, b) => {
        const prioA = getStatusPriority(a.status);
        const prioB = getStatusPriority(b.status);

        if (prioA !== prioB) {
          return isAsc ? prioB - prioA : prioA - prioB;
        }

        if (a.status === 'Jugado') {
          const timeA = a.finish_date ? new Date(a.finish_date).getTime() : 0;
          const timeB = b.finish_date ? new Date(b.finish_date).getTime() : 0;
          return isAsc ? timeA - timeB : timeB - timeA;
        }

        const timeA = new Date(a.created_at).getTime();
        const timeB = new Date(b.created_at).getTime();
        return isAsc ? timeA - timeB : timeB - timeA;
      });
      break;
  }

  return result;
});

// Paginated items to display
const displayedItems = computed(() => {
  return filteredItems.value.slice(0, visibleCount.value);
});

const hasMore = computed(() => {
  return visibleCount.value < filteredItems.value.length;
});

// Reset visible count when filters or search change
watch([activeFilter, localSearch, selectedYear, sortBy, sortOrder], () => {
  visibleCount.value = BATCH_SIZE;
});

function loadMore() {
  if (hasMore.value) {
    visibleCount.value += BATCH_SIZE;
  }
}

function setupIntersectionObserver() {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return;
  if (observer) observer.disconnect();

  observer = new IntersectionObserver(
    (entries) => {
      if (entries[0]?.isIntersecting && hasMore.value) {
        loadMore();
      }
    },
    { rootMargin: '250px' }
  );

  if (scrollSentinel.value) {
    observer.observe(scrollSentinel.value);
  }
}

async function loadItems() {
  loading.value = true;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    currentUser.value = user;

    if (user) {
      // ── Usuario autenticado: cargar desde Supabase ──────────────────────
      const dbItems = await getLibraryItems(user.id);
      items.value = dbItems.map(i => ({
        id: i.id,
        game: {
          igdb_id: i.game?.id ?? i.game_id,
          title: i.game?.title ?? 'Juego sin título',
          cover_url: i.game?.cover_url ?? null,
          release_year: i.game?.release_year ?? null,
          genres: i.game?.genres ?? [],
          developers: i.game?.developers ?? [],
          steam_appid: i.game?.steam_appid ?? null,
        },
        platform: i.platform,
        status: i.status,
        start_date: i.start_date,
        finish_date: i.finish_date,
        playtime_hours: i.playtime_hours,
        rating: i.rating,
        lent_to: i.lent_to,
        notes: i.notes,
        created_at: i.created_at,
      }));
    } else {
      // ── Sin sesión: cargar desde localStorage ───────────────────────────
      const stored = JSON.parse(localStorage.getItem('libraryItems') || '[]');
      items.value = stored;
    }
  } catch (err) {
    console.error('Error loading library:', err);
    items.value = [];
  } finally {
    loading.value = false;
  }
}

async function deleteItem(id: string) {
  const item = items.value.find(i => i.id === id);
  const title = item?.game?.title ? `"${item.game.title}"` : 'este juego';
  if (typeof window !== 'undefined' && window.confirm) {
    if (!window.confirm(`¿Estás seguro de que deseas eliminar ${title} de tu biblioteca?`)) {
      return;
    }
  }
  try {
    if (currentUser.value) {
      await deleteLibraryItemFromDB(id);
    } else {
      const updated = items.value.filter(i => i.id !== id);
      localStorage.setItem('libraryItems', JSON.stringify(updated));
    }
    items.value = items.value.filter(i => i.id !== id);
  } catch (err) {
    console.error('Error deleting item:', err);
  }
}

const addingNewRunGame = ref<any>(null);

function openNewRun(item: LibraryItem) {
  addingNewRunGame.value = {
    igdb_id: item.game.igdb_id,
    title: item.game.title,
    cover_url: item.game.cover_url,
    release_year: item.game.release_year,
    genres: item.game.genres || [],
    developers: item.game.developers || [],
    platforms: [item.platform],
    summary: null,
    steam_appid: item.game.steam_appid || null,
  };
}

function formatRawItemToLibraryItem(rawItem: any): LibraryItem {
  return {
    id: rawItem.id,
    game: {
      igdb_id: rawItem.game?.id ?? rawItem.game?.igdb_id ?? rawItem.game_id,
      title: rawItem.game?.title ?? 'Juego sin título',
      cover_url: rawItem.game?.cover_url ?? null,
      release_year: rawItem.game?.release_year ?? null,
      genres: rawItem.game?.genres ?? [],
      developers: rawItem.game?.developers ?? [],
      steam_appid: rawItem.game?.steam_appid ?? null,
    },
    platform: rawItem.platform,
    status: rawItem.status,
    start_date: rawItem.start_date,
    finish_date: rawItem.finish_date,
    playtime_hours: rawItem.playtime_hours || 0,
    rating: rawItem.rating,
    lent_to: rawItem.lent_to,
    notes: rawItem.notes,
    created_at: rawItem.created_at || new Date().toISOString(),
  };
}

function getItemTimestamp(item: LibraryItem): number {
  if (item.finish_date) {
    const t = new Date(item.finish_date).getTime();
    if (!isNaN(t)) return t;
  }
  if (item.start_date) {
    const t = new Date(item.start_date).getTime();
    if (!isNaN(t)) return t;
  }
  if (item.created_at) {
    const t = new Date(item.created_at).getTime();
    if (!isNaN(t)) return t;
  }
  return 0;
}

function getRunBadgeInfo(item: LibraryItem): { badgeText: string; totalCount: number } | null {
  const sameGameItems = items.value.filter(i => i.game.igdb_id === item.game.igdb_id);
  if (sameGameItems.length <= 1) return null;

  const sorted = [...sameGameItems].sort((a, b) => {
    const timeA = getItemTimestamp(a);
    const timeB = getItemTimestamp(b);
    if (timeA !== timeB) return timeA - timeB;
    const createdA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const createdB = b.created_at ? new Date(b.created_at).getTime() : 0;
    return createdA - createdB;
  });

  const index = sorted.findIndex(i => i.id === item.id);
  if (index === -1) return null;

  return {
    badgeText: `${index + 1}ª`,
    totalCount: sameGameItems.length,
  };
}

function getRatingLabel(rating: number): string {
  const labels: Record<number, string> = {
    1: 'Infumable',
    2: 'Meh',
    3: 'Buen juego',
    4: 'Notable',
    5: 'Excelente',
  };
  return labels[rating] || '';
}

function openEdit(item: LibraryItem) {
  editingItem.value = {
    ...item,
    game: {
      ...item.game,
      platforms: [item.platform],
      summary: null,
    },
  };
}

function handleNewRunAdded(rawItem?: any) {
  addingNewRunGame.value = null;
  if (!rawItem || !rawItem.id) {
    loadItems();
    return;
  }

  const newItem = formatRawItemToLibraryItem(rawItem);
  items.value = [newItem, ...items.value];
  window.dispatchEvent(new CustomEvent('library-updated'));
}

function handleUpdated(rawItem?: any) {
  editingItem.value = null;
  if (!rawItem || !rawItem.id) {
    loadItems();
    return;
  }

  const updatedItem = formatRawItemToLibraryItem(rawItem);
  const idx = items.value.findIndex(i => i.id === updatedItem.id);
  if (idx !== -1) {
    items.value[idx] = updatedItem;
    items.value = [...items.value];
  } else {
    items.value = [updatedItem, ...items.value];
  }

  window.dispatchEvent(new CustomEvent('library-updated'));
}

function refresh() {
  loadItems();
}

defineExpose({ refresh });

onMounted(() => {
  loadItems();
  setupIntersectionObserver();
});

onUnmounted(() => {
  if (observer) observer.disconnect();
});
</script>

<style scoped>
.library-section {
  animation: fade-in 0.4s ease-out;
}

.filters-bar {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.filter-tabs {
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
  padding-bottom: 0.25rem;
}

.filter-tab {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 1rem;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: 9999px;
  color: var(--color-text-secondary);
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s ease;
  font-family: var(--font-family-base);
}

.filter-tab:hover {
  border-color: var(--color-accent-primary);
}

.filter-tab.active {
  background: var(--color-accent-primary);
  border-color: var(--color-accent-primary);
  color: white;
}

.tab-count {
  background: rgba(255, 255, 255, 0.15);
  padding: 0.1rem 0.4rem;
  border-radius: 9999px;
  font-size: 0.7rem;
}

.filter-tab.active .tab-count {
  background: rgba(255, 255, 255, 0.25);
}

.filter-controls {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.filter-search-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  max-width: 260px;
  flex: 1;
}

.filter-search-wrapper-mobile {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
}

.filter-search {
  width: 100%;
  padding-right: 2.2rem !important;
}

.filter-search-mobile {
  width: 100%;
  padding-right: 2.2rem !important;
}

.clear-search-btn {
  position: absolute;
  right: 0.6rem;
  background: none;
  border: none;
  color: var(--color-text-muted);
  font-size: 0.85rem;
  cursor: pointer;
  padding: 0.2rem 0.4rem;
  border-radius: 50%;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  user-select: none;
  z-index: 2;
}

.clear-search-btn:hover {
  color: var(--color-text-primary);
  background: rgba(255, 255, 255, 0.12);
}

.filter-select {
  max-width: 280px;
  appearance: none;
  cursor: pointer;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.75rem center;
  padding-right: 2.5rem !important;
}

.btn-sort-order {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border-radius: 10px;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  color: var(--color-text-primary);
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
  user-select: none;
  font-family: var(--font-family-base);
}

.btn-sort-order:hover {
  border-color: var(--color-accent-primary);
  color: var(--color-accent-primary);
  background: var(--color-bg-secondary);
  box-shadow: 0 0 10px rgba(109, 40, 217, 0.2);
}

.filter-select option {
  background: var(--color-bg-secondary);
  color: var(--color-text-primary);
}

/* Grid */
.library-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1.25rem;
}

.game-card {
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  border-radius: 12px;
}

/* ── Reborde dorado para juegos de 5 estrellas (Excelente / Masterpiece) ── */
.game-card.is-masterpiece {
  border: 1px solid rgba(251, 191, 36, 0.45) !important;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4), 0 0 16px rgba(245, 158, 11, 0.18);
  transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
}

.game-card.is-masterpiece:hover {
  border-color: rgba(251, 191, 36, 0.85) !important;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5), 0 0 25px rgba(245, 158, 11, 0.35);
}

.game-card:hover .card-actions {
  opacity: 1;
}

.card-cover-wrapper {
  position: relative;
  aspect-ratio: 3 / 4;
  overflow: hidden;
  border-radius: 12px 12px 0 0;
}

.card-cover {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.game-card:hover .card-cover {
  transform: scale(1.05);
}

.card-cover-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg-card-hover);
  font-size: 3rem;
}

.card-badge {
  position: absolute;
  bottom: 0.5rem;
  left: 0.5rem;
  z-index: 12 !important;
}

/* ─── Physical Box Art Cover Modifiers ─── */
.has-switch2-banner {
  padding-top: 32px;
  background: #000;
}

.has-wii-banner {
  padding-top: 0;
  background: #ffffff;
}

.has-nds-spine {
  padding-left: 28px;
  background: #ffffff;
}

.has-3ds-spine {
  padding-right: 28px;
  background: #ffffff;
}

/* ─── Box Art Corner Badge for Nintendo Switch 1 ─── */
.box-art-header.header-switch1 {
  position: absolute;
  top: 0;
  left: 0;
  width: 44px;
  height: 44px;
  z-index: 6;
  box-shadow: 2px 2px 8px rgba(0, 0, 0, 0.4);
  border-bottom-right-radius: 6px;
  overflow: hidden;
  user-select: none;
}

.ns1-badge-logo-svg {
  width: 100%;
  height: 100%;
  display: block;
}

/* ─── Box Art Header for Nintendo Switch 2 ─── */
.box-art-header.header-switch2 {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 32px;
  background: #e60012;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3px 8px;
  z-index: 6;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
  user-select: none;
}

.ns2-banner-logo-svg {
  height: 22px;
  width: auto;
  max-width: 90%;
  display: block;
}

/* ─── Box Art Side-Bar for Nintendo DS (Left vertical white stripe) ─── */
.box-art-header.header-ds {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: 28px;
  background: #ffffff;
  border-right: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 6;
  overflow: hidden;
  user-select: none;
}

.nds-spine-logo {
  width: 140px;
  height: 20px;
  flex-shrink: 0;
  transform: rotate(-90deg);
  transform-origin: center center;
  z-index: 7;
  filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.15));
}

/* ─── Box Art Side-Bar for Nintendo 3DS (Right vertical white stripe) ─── */
.box-art-header.header-3ds {
  position: absolute;
  top: 0;
  bottom: 0;
  right: 0;
  width: 28px;
  background: #ffffff;
  border-left: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 6;
  overflow: hidden;
  user-select: none;
}

.n3ds-spine-logo {
  width: 140px;
  height: 20px;
  flex-shrink: 0;
  transform: rotate(90deg);
  transform-origin: center center;
  z-index: 7;
  filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.1));
}

/* ─── Box Art Banner for Nintendo Wii (Top white curved banner) ─── */
.box-art-header.header-wii {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 52px;
  z-index: 6;
  pointer-events: none;
  user-select: none;
}

.wii-header-bg-svg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: block;
}

.wii-banner-logo {
  position: absolute;
  top: 12px;
  right: 8px;
  height: 22px;
  width: auto;
  z-index: 7;
}

.card-info {
  padding: 0.75rem;
  flex: 1;
}

.card-title {
  font-size: 0.875rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-meta {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  margin-bottom: 0.2rem;
}

.finish-date-row {
  font-size: 0.75rem;
  margin-bottom: 0.375rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.finish-date-tag {
  color: var(--color-accent-emerald, #10b981);
  font-weight: 500;
}

.card-rating {
  display: flex;
  gap: 0.125rem;
}

.star-small {
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.star-small.filled {
  color: var(--color-accent-amber);
}

.lent-info {
  font-size: 0.7rem;
  color: var(--color-accent-secondary);
  margin-top: 0.25rem;
}

.card-actions {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  opacity: 0;
  transition: opacity 0.2s ease;
  z-index: 10;
}

.action-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.replay-btn:hover {
  background: rgba(6, 182, 212, 0.3);
  border-color: var(--color-accent-cyan);
  color: var(--color-accent-cyan);
}

.edit-btn:hover {
  background: rgba(124, 58, 237, 0.3);
  border-color: var(--color-accent-primary);
  color: var(--color-accent-primary);
}

.delete-btn:hover {
  background: rgba(244, 63, 94, 0.3);
  border-color: var(--color-accent-rose);
  color: var(--color-accent-rose);
}

.run-badge {
  position: absolute;
  bottom: 0.5rem;
  right: 0.5rem;
  background: rgba(124, 58, 237, 0.9);
  backdrop-filter: blur(4px);
  color: #ffffff;
  font-size: 0.65rem;
  font-weight: 700;
  padding: 0.2rem 0.5rem;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  gap: 0.25rem;
  z-index: 12 !important;
}

/* Scroll Sentinel & Loading More */
.scroll-sentinel {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2.5rem 1rem;
  width: 100%;
}

.loading-more {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.6rem 1.25rem;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: 9999px;
  font-size: 0.825rem;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.loading-more:hover {
  border-color: var(--color-accent-primary);
  color: var(--color-text-primary);
}

.end-of-list {
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.spinner {
  animation: spin 1s linear infinite;
  display: inline-block;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: var(--color-text-muted);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.empty-state h3 {
  font-size: 1.25rem;
  color: var(--color-text-secondary);
}

.empty-state p {
  font-size: 0.875rem;
  max-width: 400px;
}

/* Grid transitions */
.grid-enter-active {
  transition: all 0.4s ease;
}

.grid-leave-active {
  transition: all 0.3s ease;
}

.grid-enter-from {
  opacity: 0;
  transform: scale(0.9);
}

.grid-leave-to {
  opacity: 0;
  transform: scale(0.9);
}

.grid-move {
  transition: transform 0.4s ease;
}

@media (max-width: 640px) {
  .library-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 0.75rem;
  }

  .filter-controls {
    flex-direction: column;
    width: 100%;
  }

  .filter-search,
  .filter-select {
    max-width: 100%;
    width: 100%;
  }
}

/* ── Elementos exclusivos de móvil (ocultos en desktop) ── */
.filter-row-mobile,
.filter-search-mobile {
  display: none;
}

/* ── En móvil: ocultar pills y controles desktop, mostrar compactos ── */
@media (max-width: 640px) {
  .filter-tabs,
  .filter-controls {
    display: none;
  }

  .filter-row-mobile {
    display: flex;
    gap: 0.5rem;
    width: 100%;
  }

  .filter-select-mobile {
    flex: 1;
    min-width: 0;
    appearance: none;
    cursor: pointer;
    font-size: 0.8rem;
    padding: 0.5rem 0.75rem;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 0.6rem center;
    padding-right: 2rem !important;
    background-color: var(--color-bg-card);
    border: 1px solid var(--color-border);
    border-radius: 10px;
    color: var(--color-text-primary);
    font-family: var(--font-family-base);
  }

  .filter-select-mobile option {
    background: var(--color-bg-secondary);
    color: var(--color-text-primary);
  }

  .filter-search-mobile {
    display: block;
    width: 100%;
    font-size: 0.875rem;
  }
}

</style>
