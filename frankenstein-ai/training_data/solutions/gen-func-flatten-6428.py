# Task: gen-func-flatten-6428 | Score: 100% | 2026-02-14T13:26:45.818136

import ast
data = ast.literal_eval(input())
def flatten(x):
    if isinstance(x, list):
        for item in x:
            yield from flatten(item)
    else:
        yield x
print(' '.join(str(x) for x in flatten(data)))