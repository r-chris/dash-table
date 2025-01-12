import * as R from 'ramda';
import React from 'react';

import {
    ICellCoordinates,
    Data,
    Datum,
    ICellFactoryProps,
    IDropdown,
    IDropdownValue,
    IViewportOffset,
    IVisibleColumn,
    Presentation,
    VisibleColumns
} from 'dash-table/components/Table/props';
import CellInput from 'dash-table/components/CellInput';
import derivedCellEventHandlerProps, { Handler } from 'dash-table/derived/cell/eventHandlerProps';
import CellLabel from 'dash-table/components/CellLabel';
import CellDropdown from 'dash-table/components/CellDropdown';
import { memoizeOne } from 'core/memoizer';
import getFormatter from 'dash-table/type/formatter';
import { shallowClone } from 'core/math/matrixZipMap';

const mapData = R.addIndex<Datum, JSX.Element[]>(R.map);
const mapRow = R.addIndex<IVisibleColumn, JSX.Element>(R.map);

enum CellType {
    Dropdown,
    Input,
    Label
}

function getCellType(
    active: boolean,
    editable: boolean,
    dropdown: IDropdownValue[] | undefined,
    presentation: Presentation | undefined
): CellType {
    switch (presentation) {
        case Presentation.Input:
            return (!active || !editable) ? CellType.Label : CellType.Input;
        case Presentation.Dropdown:
            return (!dropdown || !editable) ? CellType.Label : CellType.Dropdown;
        default:
            return (!active || !editable) ? CellType.Label : CellType.Input;
    }
}

export default (propsFn: () => ICellFactoryProps) => new Contents(propsFn);

class Contents {
    constructor(
        propsFn: () => ICellFactoryProps,
        private readonly handlers = derivedCellEventHandlerProps(propsFn)
    ) {

    }

    partialGet = memoizeOne((
        columns: VisibleColumns,
        data: Data,
        _offset: IViewportOffset,
        isFocused: boolean,
        dropdowns: (IDropdown | undefined)[][]
    ): JSX.Element[][] => {
        const formatters = R.map(getFormatter, columns);

        return mapData(
            (datum, rowIndex) => mapRow(
                (column, columnIndex) => this.getContent(
                    false,
                    isFocused,
                    column,
                    dropdowns && dropdowns[rowIndex][columnIndex],
                    columnIndex,
                    rowIndex,
                    datum,
                    formatters
                ), columns), data);
    });

    get = memoizeOne((
        contents: JSX.Element[][],
        activeCell: ICellCoordinates | undefined,
        columns: VisibleColumns,
        data: Data,
        offset: IViewportOffset,
        isFocused: boolean,
        dropdowns: (IDropdown | undefined)[][]
    ): JSX.Element[][] => {
        if (!activeCell) {
            return contents;
        }

        const { row: iActive, column: jActive } = activeCell;
        const i = iActive - offset.rows;
        const j = jActive - offset.columns;

        if (i < 0 || j < 0 || data.length <= i || columns.length <= j) {
            return contents;
        }

        const formatters = R.map(getFormatter, columns);

        contents = shallowClone(contents);
        contents[i][j] = this.getContent(
            true,
            isFocused,
            columns[j],
            dropdowns && dropdowns[i][j],
            jActive,
            iActive,
            data[i],
            formatters
        );

        return contents;
    });

    private getContent(active: boolean, isFocused: boolean, column: IVisibleColumn, dropdown: IDropdown | undefined, columnIndex: number, rowIndex: number, datum: any, formatters: ((value: any) => any)[]) {
        const className = [
            ...(active ? ['input-active'] : []),
            isFocused ? 'focused' : 'unfocused',
            'dash-cell-value'
        ].join(' ');

        switch (getCellType(active, column.editable, dropdown && dropdown.options, column.presentation)) {
            case CellType.Dropdown:
                return (<CellDropdown
                    key={`column-${columnIndex}`}
                    active={active}
                    clearable={dropdown && dropdown.clearable}
                    dropdown={dropdown && dropdown.options}
                    onChange={this.handlers(Handler.Change, rowIndex, columnIndex)}
                    value={datum[column.id]}
                />);
            case CellType.Input:
                return (<CellInput
                    key={`column-${columnIndex}`}
                    active={active}
                    className={className}
                    focused={isFocused}
                    onChange={this.handlers(Handler.Change, rowIndex, columnIndex)}
                    onClick={this.handlers(Handler.Click, rowIndex, columnIndex)}
                    onDoubleClick={this.handlers(Handler.DoubleClick, rowIndex, columnIndex)}
                    onMouseUp={this.handlers(Handler.MouseUp, rowIndex, columnIndex)}
                    onPaste={this.handlers(Handler.Paste, rowIndex, columnIndex)}
                    type={column.type}
                    value={datum[column.id]}
                />);
            case CellType.Label:
            default:
                return (<CellLabel
                    className={className}
                    key={`column-${columnIndex}`}
                    onClick={this.handlers(Handler.Click, rowIndex, columnIndex)}
                    onDoubleClick={this.handlers(Handler.DoubleClick, rowIndex, columnIndex)}
                    value={formatters[columnIndex](datum[column.id])}
                />);
        }
    }
}
