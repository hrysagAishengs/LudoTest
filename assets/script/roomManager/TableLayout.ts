import { instantiate, Node, UITransform, Vec3, Widget } from "cc";
import {
    HorizontalAlignType,
    RoomPanelCreateMode,
    RoomAlignMode,
    RoomConfigGroup,
    VerticalAlignType,
    WidgetInfo
} from "../factorySys/component/ConfigProperty";
import { PlayerPanel } from "../gamePlayer/PlayerPanel";
import { IPlayerInfoPanel } from "../gamePlayer/def/PanelDef";
import { TwoPlayerBottomPanel } from "../gamePlayer/TwoPlayerBottomPanel";

/**
 * Handles player panel creation and table placement.
 * RoomPlayerManager owns player data; this class owns layout details.
 */
export class TableLayout {
    private _twoPlayerBottomPanel: TwoPlayerBottomPanel | null = null;
    private _twoPlayerBottomPanelNode: Node | null = null;
    private _panelLayoutNodeMap: WeakMap<IPlayerInfoPanel, Node> = new WeakMap();
    
    public validateRoomConfig(roomConfig: RoomConfigGroup | null): boolean {
        if (!roomConfig) {
            console.error("TableLayout: room config is not initialized");
            return false;
        }

        if (!roomConfig.playerPanelPrefab) {
            console.error("TableLayout: playerPanelPrefab is not set");
            return false;
        }

        if (!roomConfig.panelContainer) {
            console.error("TableLayout: panelContainer is not set");
            return false;
        }

        if (roomConfig.roomAlignMode === RoomAlignMode.POSITION) {
            if (!roomConfig.chairs || roomConfig.chairs.length === 0) {
                console.error("TableLayout: chairs is empty");
                return false;
            }
        }

        if (roomConfig.roomAlignMode === RoomAlignMode.WIDGET) {
            if (!roomConfig.widgets || roomConfig.widgets.length === 0) {
                console.error("TableLayout: widgets is empty");
                return false;
            }
        }

        return true;
    }

    public createPlayerPanel(
        roomConfig: RoomConfigGroup | null,
        localViewIndex: number,
        isPlayerOwner: boolean,
        roomMaxPlayerCount: number
    ): IPlayerInfoPanel  | null {
        if (!this.validateRoomConfig(roomConfig)) {
            return null;
        }

        if (localViewIndex < 0 || localViewIndex > 3) {
            console.error(`TableLayout: invalid localViewIndex: ${localViewIndex}`);
            return null;
        }

        const layoutIndex = this.getLayoutIndex(localViewIndex, isPlayerOwner, roomMaxPlayerCount);
        if (roomConfig.panelCreateMode === RoomPanelCreateMode.SHARED_PANEL_CONTAINER) {
            return this.createTwoPlayerPanelAdapter(roomConfig, localViewIndex, 0);
        }

        return this.createSinglePlayerPanel(roomConfig, localViewIndex, layoutIndex);
    }

    public clear(): void {
        if (this._twoPlayerBottomPanelNode?.isValid) {
            this._twoPlayerBottomPanelNode.destroy();
        }

        this._twoPlayerBottomPanel = null;
        this._twoPlayerBottomPanelNode = null;
        this._panelLayoutNodeMap = new WeakMap();
    }

    public destroyPlayerPanel(panel: IPlayerInfoPanel): void {
        const layoutNode = this._panelLayoutNodeMap.get(panel);
        if (layoutNode?.isValid) {
            layoutNode.destroy();
            this._panelLayoutNodeMap.delete(panel);
            return;
        }

        if (panel.node?.isValid) {
            panel.node.destroy();
        }
    }

    private createSinglePlayerPanel(
        roomConfig: RoomConfigGroup,
        localViewIndex: number,
        layoutIndex: number
    ): IPlayerInfoPanel | null {
        const panelNode = instantiate(roomConfig.playerPanelPrefab);
        panelNode.name = `PlayerPanel_${localViewIndex}`;
        panelNode.setParent(roomConfig.panelContainer);
        panelNode.active = true;

        const panel = panelNode.getComponent(PlayerPanel);
        if (!panel) {
            console.error(`TableLayout: localViewIndex ${localViewIndex} missing PlayerPanel component`);
            panelNode.destroy();
            return null;
        }

        const placed = this.applyPanelPlacement(panelNode, roomConfig, layoutIndex);
        if (!placed) {
            panelNode.destroy();
            return null;
        }

        this._panelLayoutNodeMap.set(panel, this.getPanelLayoutNode(panelNode));
        return panel;
    }

    private createTwoPlayerPanelAdapter(
        roomConfig: RoomConfigGroup,
        localViewIndex: number,
        layoutIndex: number
    ): IPlayerInfoPanel | null {
        const bottomPanel = this.getOrCreateTwoPlayerBottomPanel(roomConfig, layoutIndex);
        if (!bottomPanel) {
            return null;
        }

        const panelAdapter = bottomPanel.getPanelAdapterByLocalViewIndex(localViewIndex);
        if (!panelAdapter) {
            console.error(`TableLayout: localViewIndex ${localViewIndex} missing 2P panel adapter`);
            return null;
        }

        return panelAdapter;
    }

    private getOrCreateTwoPlayerBottomPanel(
        roomConfig: RoomConfigGroup,
        layoutIndex: number
    ): TwoPlayerBottomPanel | null {
        if (this._twoPlayerBottomPanel && this._twoPlayerBottomPanelNode?.isValid) {
            return this._twoPlayerBottomPanel;
        }

        const panelNode = instantiate(roomConfig.playerPanelPrefab);
        panelNode.name = 'TwoPlayerBottomHUD';
        panelNode.setParent(roomConfig.panelContainer);
        panelNode.active = true;

        const bottomPanel = panelNode.getComponent(TwoPlayerBottomPanel);
        if (!bottomPanel) {
            console.error('TableLayout: 2P prefab missing TwoPlayerBottomPanel component');
            panelNode.destroy();
            return null;
        }

        const placed = this.applyPanelPlacement(panelNode, roomConfig, layoutIndex);
        if (!placed) {
            panelNode.destroy();
            return null;
        }

        bottomPanel.createAdapters();
        this._twoPlayerBottomPanel = bottomPanel;
        this._twoPlayerBottomPanelNode = panelNode;
        return bottomPanel;
    }

    private getLayoutIndex(localViewIndex: number, isPlayerOwner: boolean, roomMaxPlayerCount: number): number {
        if (roomMaxPlayerCount === 2) {
            return isPlayerOwner ? 0 : 1;
        }

        return localViewIndex;
    }

    private applyPanelPlacement(panelNode: Node, roomConfig: RoomConfigGroup, layoutIndex: number): boolean {
        switch (roomConfig.roomAlignMode) {
            case RoomAlignMode.POSITION:
                return this.applyPositionLayout(panelNode, roomConfig, layoutIndex);

            case RoomAlignMode.WIDGET:
                return this.applyWidgetLayout(panelNode, roomConfig, layoutIndex);

            default:
                console.error(`TableLayout: unsupported roomAlignMode: ${roomConfig.roomAlignMode}`);
                return false;
        }
    }

    private getPanelLayoutNode(panelNode: Node): Node {
        const parentNode = panelNode.parent;
        if (parentNode && parentNode.name.startsWith('PlayerPanelSlot_')) {
            return parentNode;
        }

        return panelNode;
    }

    private applyPositionLayout(panelNode: Node, roomConfig: RoomConfigGroup, layoutIndex: number): boolean {
        if (layoutIndex < 0 || layoutIndex >= roomConfig.chairs.length) {
            console.error(`TableLayout: invalid chair layoutIndex: ${layoutIndex}`);
            return false;
        }

        const chairPos = roomConfig.chairs[layoutIndex];
        panelNode.setPosition(new Vec3(chairPos.x, chairPos.y, 0));
        return true;
    }

    private applyWidgetLayout(panelNode: Node, roomConfig: RoomConfigGroup, layoutIndex: number): boolean {
        if (layoutIndex < 0 || layoutIndex >= roomConfig.widgets.length) {
            console.error(`TableLayout: invalid widget layoutIndex: ${layoutIndex}`);
            return false;
        }

        const widgetInfo = roomConfig.widgets[layoutIndex];
        const panelTransform = panelNode.getComponent(UITransform) ?? panelNode.addComponent(UITransform);
        panelTransform.setAnchorPoint(0.5, 0.5);

        // NEW 2026-05-09: In WIDGET mode, the outer slot owns table placement.
        // The instantiated prefab keeps its centered visual coordinates.
        const slotNode = new Node(`PlayerPanelSlot_${layoutIndex}`);
        slotNode.layer = panelNode.layer;
        slotNode.setParent(roomConfig.panelContainer);

        const slotTransform = slotNode.addComponent(UITransform);
        slotTransform.setContentSize(panelTransform.contentSize);
        slotTransform.setAnchorPoint(widgetInfo.anchorPoint.x, widgetInfo.anchorPoint.y);

        panelNode.setParent(slotNode);
        const panelSize = panelTransform.contentSize;
        const panelOffsetX = (0.5 - widgetInfo.anchorPoint.x) * panelSize.width;
        const panelOffsetY = (0.5 - widgetInfo.anchorPoint.y) * panelSize.height;
        panelNode.setPosition(new Vec3(panelOffsetX, panelOffsetY, 0));

        const widget = slotNode.addComponent(Widget);
        this.resetWidgetAlign(widget);
        this.applyWidgetInfo(widget, widgetInfo);
        widget.updateAlignment();
        return true;
    }

    private resetWidgetAlign(widget: Widget): void {
        widget.isAlignTop = false;
        widget.isAlignBottom = false;
        widget.isAlignLeft = false;
        widget.isAlignRight = false;
        widget.isAlignVerticalCenter = false;
        widget.isAlignHorizontalCenter = false;
    }

    private applyWidgetInfo(widget: Widget, widgetInfo: WidgetInfo): void {
        this.applyVerticalWidgetInfo(widget, widgetInfo);
        this.applyHorizontalWidgetInfo(widget, widgetInfo);
    }

    private applyVerticalWidgetInfo(widget: Widget, widgetInfo: WidgetInfo): void {
        switch (widgetInfo.verticalAlignType) {
            case VerticalAlignType.TOP:
                widget.isAlignTop = true;
                widget.top = widgetInfo.top + widgetInfo.margin;
                break;

            case VerticalAlignType.CENTER:
                widget.isAlignVerticalCenter = true;
                widget.verticalCenter = widgetInfo.verticalCenter + widgetInfo.margin;
                break;

            case VerticalAlignType.BOTTOM:
                widget.isAlignBottom = true;
                widget.bottom = widgetInfo.bottom + widgetInfo.margin;
                break;
        }
    }

    private applyHorizontalWidgetInfo(widget: Widget, widgetInfo: WidgetInfo): void {
        switch (widgetInfo.horizontalAlignType) {
            case HorizontalAlignType.LEFT:
                widget.isAlignLeft = true;
                widget.left = widgetInfo.left + widgetInfo.margin;
                break;

            case HorizontalAlignType.CENTER:
                widget.isAlignHorizontalCenter = true;
                widget.horizontalCenter = widgetInfo.horizontalCenter + widgetInfo.margin;
                break;

            case HorizontalAlignType.RIGHT:
                widget.isAlignRight = true;
                widget.right = widgetInfo.right + widgetInfo.margin;
                break;
        }
    }
}
