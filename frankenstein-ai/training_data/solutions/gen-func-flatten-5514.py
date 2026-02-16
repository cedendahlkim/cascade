# Task: gen-func-flatten-5514 | Score: 100% | 2026-02-15T09:02:30.955745

import ast
data = ast.literal_eval(input())
def flatten(x):
    if isinstance(x, list):
        for item in x:
            yield from flatten(item)
    else:
        yield x
print(' '.join(str(x) for x in flatten(data)))