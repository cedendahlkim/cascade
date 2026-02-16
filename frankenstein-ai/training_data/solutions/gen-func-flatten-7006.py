# Task: gen-func-flatten-7006 | Score: 100% | 2026-02-13T15:11:01.616748

import ast
data = ast.literal_eval(input())
def flatten(x):
    if isinstance(x, list):
        for item in x:
            yield from flatten(item)
    else:
        yield x
print(' '.join(str(x) for x in flatten(data)))