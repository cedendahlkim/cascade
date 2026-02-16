# Task: gen-func-flatten-5439 | Score: 100% | 2026-02-13T08:56:02.625533

def flatten(lst):
    res = []
    for item in lst:
        if isinstance(item, list):
            res.extend(flatten(item))
        else:
            res.append(item)
    return res

import ast
input_str = input()
lst = ast.literal_eval(input_str)
flat_list = flatten(lst)
print(*flat_list)