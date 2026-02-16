# Task: gen-func-flatten-6732 | Score: 100% | 2026-02-13T21:28:17.218777

import ast
data = ast.literal_eval(input())
def flatten(x):
    if isinstance(x, list):
        for item in x:
            yield from flatten(item)
    else:
        yield x
print(' '.join(str(x) for x in flatten(data)))