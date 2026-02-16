# Task: gen-func-flatten-9896 | Score: 100% | 2026-02-14T12:28:36.107116

import ast
data = ast.literal_eval(input())
def flatten(x):
    if isinstance(x, list):
        for item in x:
            yield from flatten(item)
    else:
        yield x
print(' '.join(str(x) for x in flatten(data)))