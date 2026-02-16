# Task: gen-func-flatten-2212 | Score: 100% | 2026-02-12T13:50:35.216663

def flatten(lst):
    res = []
    for i in lst:
        if isinstance(i, list):
            res.extend(flatten(i))
        else:
            res.append(i)
    return res

import ast
input_str = input()
lst = ast.literal_eval(input_str)
flat_list = flatten(lst)
print(*flat_list)