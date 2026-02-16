# Task: gen-func-flatten-4183 | Score: 100% | 2026-02-13T13:43:10.244732

import ast
data = ast.literal_eval(input())
def flatten(x):
    if isinstance(x, list):
        for item in x:
            yield from flatten(item)
    else:
        yield x
print(' '.join(str(x) for x in flatten(data)))