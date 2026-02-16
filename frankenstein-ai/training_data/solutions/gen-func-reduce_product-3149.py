# Task: gen-func-reduce_product-3149 | Score: 100% | 2026-02-13T18:23:15.122515

n = int(input())
lst = [int(input()) for _ in range(n)]
p = 1
for x in lst:
    p *= x
print(p)