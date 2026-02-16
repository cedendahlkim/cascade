# Task: gen-func-flatten-4848 | Score: 100% | 2026-02-15T11:13:02.617545

import ast
data = ast.literal_eval(input())
def flatten(x):
    if isinstance(x, list):
        for item in x:
            yield from flatten(item)
    else:
        yield x
print(' '.join(str(x) for x in flatten(data)))