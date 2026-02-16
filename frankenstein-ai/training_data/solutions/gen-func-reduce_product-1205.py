# Task: gen-func-reduce_product-1205 | Score: 100% | 2026-02-13T14:10:08.602198

n = int(input())
lst = [int(input()) for _ in range(n)]
p = 1
for x in lst:
    p *= x
print(p)