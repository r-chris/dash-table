import * as R from 'ramda';

import Environment from 'core/environment';

import { generateMockData, IDataMock, generateSpaceMockData } from './data';
import {
    PropsWithDefaults,
    ChangeAction,
    ChangeFailure,
    IVisibleColumn,
    ColumnType,
    TableAction
} from 'dash-table/components/Table/props';
import { TooltipSyntax } from 'dash-table/tooltips/props';

export enum AppMode {
    Date = 'date',
    Default = 'default',
    Filtering = 'filtering',
    FixedTooltips = 'fixed,tooltips',
    FixedVirtualized = 'fixed,virtualized',
    Formatting = 'formatting',
    ReadOnly = 'readonly',
    ColumnsInSpace = 'columnsInSpace',
    TaleOfTwoTables = 'taleOfTwoTables',
    Tooltips = 'tooltips',
    Typed = 'typed',
    Virtualized = 'virtualized'
}

export const ReadWriteModes = [
    AppMode.Default,
    AppMode.FixedVirtualized,
    AppMode.Virtualized
];

export const BasicModes = [
    ...ReadWriteModes,
    AppMode.ReadOnly
];

function getBaseTableProps(mock: IDataMock) {
    return {
        id: 'table',
        columns: mock.columns.map((col: any) => R.merge(col, {
            name: col.name || col.id,
            on_change: {
                action: ChangeAction.None
            },
            renamable: true,
            deletable: true
        })),
        dropdown: {
            bbb: {
                clearable: true,
                options: ['Humid', 'Wet', 'Snowy', 'Tropical Beaches'].map(i => ({
                    label: i,
                    value: i
                }))
            }
        },
        page_action: TableAction.None,
        style_table: {
            max_height: '800px',
            height: '800px',
            max_width: '1000px',
            width: '1000px'
        },
        style_cell_conditional: [
            { max_width: 150, min_width: 150, width: 150 },
            { if: { column_id: 'rows' }, max_width: 60, min_width: 60, width: 60 },
            { if: { column_id: 'bbb' }, max_width: 200, min_width: 200, width: 200 },
            { if: { column_id: 'bbb-readonly' }, max_width: 200, min_width: 200, width: 200 }
        ]
    };
}

function getDefaultState(
    generateData: Function = generateMockData
): {
    filter_query: string,
    tableProps: Partial<PropsWithDefaults>
} {
    const mock = generateData(5000);

    return {
        filter_query: '',
        tableProps: R.merge(getBaseTableProps(mock), {
            data: mock.data,
            editable: true,
            sort_action: TableAction.Native,
            fixed_rows: { headers: true },
            fixed_columns: { headers: true },
            merge_duplicate_headers: false,
            row_deletable: true,
            row_selectable: 'single',
            page_action: TableAction.Native
        }) as Partial<PropsWithDefaults>
    };
}

function getReadonlyState() {
    const state = getDefaultState();
    state.tableProps.editable = false;
    state.tableProps.row_deletable = false;

    R.forEach(column => {
        column.editable = false;
    }, state.tableProps.columns || []);

    return state;
}

function getSpaceInColumn() {
    const state = getDefaultState(generateSpaceMockData);
    state.tableProps.filter_action = TableAction.Native;

    return state;
}

function getFixedTooltipsState() {
    const state = getTooltipsState();

    state.tableProps.fixed_columns = { headers: true, data: 1 };
    state.tableProps.fixed_rows = { headers: true, data: 1 };

    return state;
}

function getTooltipsState() {
    const state = getDefaultState();

    state.tableProps.tooltip_delay = 250;
    state.tableProps.tooltip_duration = 1000;
    state.tableProps.tooltip_data = [
        { ccc: { type: TooltipSyntax.Markdown, value: `### Go Proverb\nThe enemy's key point is yours` } },
        { ccc: { type: TooltipSyntax.Markdown, value: `### Go Proverb\nPlay on the point of symmetry` } },
        { ccc: { type: TooltipSyntax.Markdown, value: `### Go Proverb\nSente gains nothing` } },
        { ccc: { type: TooltipSyntax.Text, value: `Beware of going back to patch up` } },
        { ccc: { type: TooltipSyntax.Text, value: `When in doubt, Tenuki` } },
        { ccc: `People in glass houses should not throw stones` }
    ];
    state.tableProps.tooltip = {
        ccc: { type: TooltipSyntax.Text, value: `There is death in the hane` },
        ddd: { type: TooltipSyntax.Markdown, value: `Hane, Cut, Placement` },
        rows: `Learn the eyestealing tesuji`
    };
    state.tableProps.tooltip_conditional = [{
        if: {
            column_id: 'aaa-readonly',
            filter_query: `{aaa} is prime`
        },
        type: TooltipSyntax.Markdown,
        value: `### Go Proverbs\nCapture three to get an eye`
    }, {
        if: {
            column_id: 'bbb-readonly',
            row_index: 'odd'
        },
        type: TooltipSyntax.Markdown,
        value: `### Go Proverbs\nSix die but eight live`
    }, {
        if: {
            column_id: 'bbb-readonly'
        },
        type: TooltipSyntax.Markdown,
        value: `### Go Proverbs\nUrgent points before big points\n![Sensei](https://senseis.xmp.net/images/stone-hello.png)`
    }];

    return state;
}

function getTypedState() {
    const state = getDefaultState();

    R.forEach(column => {
        (column as IVisibleColumn).on_change = {
            action: ChangeAction.Coerce,
            failure: ChangeFailure.Reject
        };
    }, state.tableProps.columns || []);

    return state;
}

function getDateState() {
    const state = getTypedState();

    (state.tableProps.columns || []).forEach(column => {
        if (column.id === 'ccc') {
            column.name = ['Date', 'only'];
            column.type = ColumnType.Datetime;
            column.validation = { allow_YY: true };
            (state.tableProps.data || []).forEach((row, i) => {
                const d = new Date(Date.UTC(2018, 0, 1));
                // three day increment
                d.setUTCDate(3 * i + 1);
                // date only
                row.ccc = d.toISOString().substr(0, 10);
            });
        } else if (column.id === 'ddd') {
            column.name = ['Date', 'with', 'time'];
            column.type = ColumnType.Datetime;
            (state.tableProps.data || []).forEach((row, i) => {
                const d = new Date(Date.UTC(2018, 0, 1));
                // two hours and 11 seconds increment
                d.setUTCSeconds(i * 7211);
                // datetime ending with seconds
                row.ddd = d.toISOString().substr(0, 19).replace('T', ' ');
            });
        }
    });

    return state;
}

function getFilteringState() {
    const state = getDefaultState();
    state.tableProps.filter_action = TableAction.Native;

    return state;
}

function getVirtualizedState() {
    const mock = generateMockData(5000);

    return {
        filter_query: '',
        tableProps: R.merge(getBaseTableProps(mock), {
            data: mock.data,
            editable: true,
            sort_action: TableAction.Native,
            merge_duplicate_headers: false,
            row_deletable: true,
            row_selectable: 'single',
            virtualization: true
        })
    };
}

function getFixedVirtualizedState() {
    const mock = generateMockData(5000);

    return {
        filter_query: '',
        tableProps: R.merge(getBaseTableProps(mock), {
            data: mock.data,
            editable: true,
            sort_action: TableAction.Native,
            fixed_rows: { headers: true },
            fixed_columns: { headers: true },
            merge_duplicate_headers: false,
            row_deletable: true,
            row_selectable: 'single',
            virtualization: true
        })
    };
}

function getFormattingState() {
    const state = getDefaultState();

    R.forEach((datum: any) => {
        if (datum.eee % 2 === 0) {
            datum.eee = undefined;
        } else if (datum.eee % 10 === 5) {
            datum.eee = `xx-${datum.eee}-xx`;
        }
    }, state.tableProps.data as any);

    R.forEach((column: any) => {
        if (column.id === 'rows') {
            column.format = {
                specifier: '.^5'
            };
        } else if (column.id === 'ccc') {
            column.format = {
                locale: {
                    separate_4digits: false
                },
                prefix: 1000,
                specifier: '.3f'
            };
        } else if (column.id === 'ddd') {
            column.format = {
                locale: {
                    symbol: ['eq. $ ', ''],
                    separate_4digits: false
                },
                nully: 0,
                specifier: '$,.2f'
            };
            column.on_change = {
                action: 'coerce',
                failure: 'default'
            };
            column.validation = {
                allow_nully: true
            };
        } else if (column.id === 'eee') {
            column.format = {
                nully: 'N/A',
                specifier: ''
            };
            column.on_change = {
                action: 'coerce',
                failure: 'default'
            };
        }
    }, state.tableProps.columns as any);

    return state;
}

function getState() {
    const mode = Environment.searchParams.get('mode');

    switch (mode) {
        case AppMode.Date:
            return getDateState();
        case AppMode.Filtering:
            return getFilteringState();
        case AppMode.FixedTooltips:
            return getFixedTooltipsState();
        case AppMode.FixedVirtualized:
            return getFixedVirtualizedState();
        case AppMode.Formatting:
            return getFormattingState();
        case AppMode.ReadOnly:
            return getReadonlyState();
        case AppMode.ColumnsInSpace:
            return getSpaceInColumn();
        case AppMode.Tooltips:
            return getTooltipsState();
        case AppMode.Virtualized:
            return getVirtualizedState();
        case AppMode.Typed:
            return getTypedState();
        case AppMode.TaleOfTwoTables:
        case AppMode.Default:
        default:
            return getDefaultState();
    }
}
export default getState();
