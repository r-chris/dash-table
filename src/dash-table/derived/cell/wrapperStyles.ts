import * as R from 'ramda';
import { CSSProperties } from 'react';

import { memoizeOneFactory } from 'core/memoizer';
import { Dataframe, VisibleColumns } from 'dash-table/components/Table/props';
import { IConvertedStyle } from '../style';

type Style = CSSProperties | undefined;

function getter(
    columns: VisibleColumns,
    columnStyles: IConvertedStyle[],
    dataframe: Dataframe
): Style[][] {
    return R.addIndex<any, Style[]>(R.map)((datum, index) => R.map(column => {
        const relevantStyles = R.map(
            s => s.style,
            R.filter(
                style =>
                    (!style.id || style.id === column.id) &&
                    (!style.idx || style.idx(index)) &&
                    (!style.filter || style.filter.evaluate(datum)),
                columnStyles
            )
        );

        return relevantStyles.length ? R.mergeAll(relevantStyles) : undefined;
    }, columns), dataframe);
}

export default memoizeOneFactory(getter);
