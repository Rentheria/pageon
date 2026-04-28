import { SimpleChange } from '@angular/core';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { PageonViewerComponent } from '../pageon-viewer/pageon-viewer.component';

const onMock = vi.fn();
const destroyMock = vi.fn(async () => undefined);
const reloadMock = vi.fn(async () => undefined);
const setZoomMock = vi.fn(async () => undefined);
const setFitModeMock = vi.fn(async () => undefined);
const updateOptionsMock = vi.fn();

vi.mock('@pageon/core', () => {
  return {
    Pageon: vi.fn().mockImplementation(() => ({
      on: onMock,
      destroy: destroyMock,
      reload: reloadMock,
      setZoom: setZoomMock,
      setFitMode: setFitModeMock,
      updateOptions: updateOptionsMock
    }))
  };
});

describe('PageonViewerComponent', () => {
  beforeEach(() => {
    onMock.mockReset();
    destroyMock.mockClear();
    reloadMock.mockClear();
    setZoomMock.mockClear();
    setFitModeMock.mockClear();
    updateOptionsMock.mockClear();

    onMock.mockImplementation(() => () => undefined);
  });

  function createComponent(): PageonViewerComponent {
    const component = new PageonViewerComponent();
    component.src = '/sample.pdf';
    component.containerRef = {
      nativeElement: document.createElement('div')
    } as never;
    return component;
  }

  it('creates component', () => {
    const component = new PageonViewerComponent();
    expect(component).toBeTruthy();
  });

  it('initializes Pageon core on ngAfterViewInit', async () => {
    const { Pageon } = await import('@pageon/core');
    const component = createComponent();

    component.ngAfterViewInit();

    expect(Pageon).toHaveBeenCalledTimes(1);
  });

  it('destroys Pageon on ngOnDestroy', async () => {
    const component = createComponent();
    component.ngAfterViewInit();

    component.ngOnDestroy();

    expect(destroyMock).toHaveBeenCalledTimes(1);
  });

  it('binds and emits events', () => {
    const component = createComponent();
    const emitSpy = vi.spyOn(component.loaded, 'emit');

    component.ngAfterViewInit();

    const callback = onMock.mock.calls[0][1];
    callback({ totalPages: 10 });

    expect(emitSpy).toHaveBeenCalledWith({ totalPages: 10 });
  });

  it('reacts to src changes', () => {
    const component = createComponent();
    component.ngAfterViewInit();

    component.ngOnChanges({
      src: new SimpleChange('/one.pdf', '/two.pdf', false)
    });

    expect(updateOptionsMock).toHaveBeenCalled();
    expect(reloadMock).toHaveBeenCalledTimes(1);
  });

  it('reacts to scale changes', () => {
    const component = createComponent();
    component.ngAfterViewInit();

    component.scale = 1.5;
    component.ngOnChanges({
      scale: new SimpleChange(1, 1.5, false)
    });

    expect(setZoomMock).toHaveBeenCalledWith(1.5);
  });

  it('reacts to fitMode changes', () => {
    const component = createComponent();
    component.fitMode = 'width';
    component.ngAfterViewInit();

    component.ngOnChanges({
      fitMode: new SimpleChange('none', 'width', false)
    });

    expect(setFitModeMock).toHaveBeenCalledWith('width');
  });
});
