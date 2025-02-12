/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import { EuiSpacer, useEuiTheme, useIsWithinBreakpoints } from '@elastic/eui';
import type { PropsWithChildren, ReactElement, RefObject } from 'react';
import React, { useMemo } from 'react';
import { createHtmlPortalNode, InPortal, OutPortal } from 'react-reverse-portal';
import { css } from '@emotion/css';
import type { DataView, DataViewField } from '@kbn/data-views-plugin/public';
import type { TypedLensByValueInput } from '@kbn/lens-plugin/public';
import { Chart } from '../chart';
import { Panels, PANELS_MODE } from '../panels';
import type {
  UnifiedHistogramChartContext,
  UnifiedHistogramServices,
  UnifiedHistogramHitsContext,
  UnifiedHistogramBreakdownContext,
  UnifiedHistogramFetchStatus,
  UnifiedHistogramRequestContext,
  UnifiedHistogramChartLoadEvent,
} from '../types';

export interface UnifiedHistogramLayoutProps extends PropsWithChildren<unknown> {
  /**
   * Optional class name to add to the layout container
   */
  className?: string;
  /**
   * Required services
   */
  services: UnifiedHistogramServices;
  /**
   * The current data view
   */
  dataView: DataView;
  /**
   * Can be updated to `Date.now()` to force a refresh
   */
  lastReloadRequestTime?: number;
  /**
   * Context object for requests made by unified histogram components -- optional
   */
  request?: UnifiedHistogramRequestContext;
  /**
   * Context object for the hits count -- leave undefined to hide the hits count
   */
  hits?: UnifiedHistogramHitsContext;
  /**
   * Context object for the chart -- leave undefined to hide the chart
   */
  chart?: UnifiedHistogramChartContext;
  /**
   * Context object for the breakdown -- leave undefined to hide the breakdown
   */
  breakdown?: UnifiedHistogramBreakdownContext;
  /**
   * Ref to the element wrapping the layout which will be used for resize calculations
   */
  resizeRef: RefObject<HTMLDivElement>;
  /**
   * Current top panel height -- leave undefined to use the default
   */
  topPanelHeight?: number;
  /**
   * Append a custom element to the right of the hits count
   */
  appendHitsCounter?: ReactElement;
  /**
   * Callback to update the topPanelHeight prop when a resize is triggered
   */
  onTopPanelHeightChange?: (topPanelHeight: number | undefined) => void;
  /**
   * Callback to invoke when the user clicks the edit visualization button -- leave undefined to hide the button
   */
  onEditVisualization?: (lensAttributes: TypedLensByValueInput['attributes']) => void;
  /**
   * Callback to hide or show the chart -- should set {@link UnifiedHistogramChartContext.hidden} to chartHidden
   */
  onChartHiddenChange?: (chartHidden: boolean) => void;
  /**
   * Callback to update the time interval -- should set {@link UnifiedHistogramChartContext.timeInterval} to timeInterval
   */
  onTimeIntervalChange?: (timeInterval: string) => void;
  /**
   * Callback to update the breakdown field -- should set {@link UnifiedHistogramBreakdownContext.field} to breakdownField
   */
  onBreakdownFieldChange?: (breakdownField: DataViewField | undefined) => void;
  /**
   * Callback to update the total hits -- should set {@link UnifiedHistogramHitsContext.status} to status
   * and {@link UnifiedHistogramHitsContext.total} to result
   */
  onTotalHitsChange?: (status: UnifiedHistogramFetchStatus, result?: number | Error) => void;
  /**
   * Called when the histogram loading status changes
   */
  onChartLoad?: (event: UnifiedHistogramChartLoadEvent) => void;
}

export const UnifiedHistogramLayout = ({
  className,
  services,
  dataView,
  lastReloadRequestTime,
  request,
  hits,
  chart,
  breakdown,
  resizeRef,
  topPanelHeight,
  appendHitsCounter,
  onTopPanelHeightChange,
  onEditVisualization,
  onChartHiddenChange,
  onTimeIntervalChange,
  onBreakdownFieldChange,
  onTotalHitsChange,
  onChartLoad,
  children,
}: UnifiedHistogramLayoutProps) => {
  const topPanelNode = useMemo(
    () => createHtmlPortalNode({ attributes: { class: 'eui-fullHeight' } }),
    []
  );

  const mainPanelNode = useMemo(
    () => createHtmlPortalNode({ attributes: { class: 'eui-fullHeight' } }),
    []
  );

  const isMobile = useIsWithinBreakpoints(['xs', 's']);
  const showFixedPanels = isMobile || !chart || chart.hidden;
  const { euiTheme } = useEuiTheme();
  const defaultTopPanelHeight = euiTheme.base * 12;
  const minMainPanelHeight = euiTheme.base * 10;

  const chartClassName =
    isMobile && chart && !chart.hidden
      ? css`
          height: ${defaultTopPanelHeight}px;
        `
      : 'eui-fullHeight';

  const panelsMode =
    chart || hits
      ? showFixedPanels
        ? PANELS_MODE.FIXED
        : PANELS_MODE.RESIZABLE
      : PANELS_MODE.SINGLE;

  const currentTopPanelHeight = topPanelHeight ?? defaultTopPanelHeight;

  const onResetChartHeight = useMemo(() => {
    return currentTopPanelHeight !== defaultTopPanelHeight && panelsMode === PANELS_MODE.RESIZABLE
      ? () => onTopPanelHeightChange?.(undefined)
      : undefined;
  }, [currentTopPanelHeight, defaultTopPanelHeight, onTopPanelHeightChange, panelsMode]);

  return (
    <>
      <InPortal node={topPanelNode}>
        <Chart
          className={chartClassName}
          services={services}
          dataView={dataView}
          lastReloadRequestTime={lastReloadRequestTime}
          request={request}
          hits={hits}
          chart={chart}
          breakdown={breakdown}
          appendHitsCounter={appendHitsCounter}
          appendHistogram={showFixedPanels ? <EuiSpacer size="s" /> : <EuiSpacer size="l" />}
          onEditVisualization={onEditVisualization}
          onResetChartHeight={onResetChartHeight}
          onChartHiddenChange={onChartHiddenChange}
          onTimeIntervalChange={onTimeIntervalChange}
          onBreakdownFieldChange={onBreakdownFieldChange}
          onTotalHitsChange={onTotalHitsChange}
          onChartLoad={onChartLoad}
        />
      </InPortal>
      <InPortal node={mainPanelNode}>{children}</InPortal>
      <Panels
        className={className}
        mode={panelsMode}
        resizeRef={resizeRef}
        topPanelHeight={currentTopPanelHeight}
        minTopPanelHeight={defaultTopPanelHeight}
        minMainPanelHeight={minMainPanelHeight}
        topPanel={<OutPortal node={topPanelNode} />}
        mainPanel={<OutPortal node={mainPanelNode} />}
        onTopPanelHeightChange={onTopPanelHeightChange}
      />
    </>
  );
};

// eslint-disable-next-line import/no-default-export
export default UnifiedHistogramLayout;
