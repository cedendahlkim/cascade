# Task: gen-func-flatten-2989 | Score: 100% | 2026-02-15T10:50:51.841770

import ast
data = ast.literal_eval(input())
def flatten(x):
    if isinstance(x, list):
        for item in x:
            yield from flatten(item)
    else:
        yield x
print(' '.join(str(x) for x in flatten(data)))