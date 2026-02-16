# Task: gen-func-reduce_product-9000 | Score: 100% | 2026-02-13T17:36:25.469779

n = int(input())
lst = [int(input()) for _ in range(n)]
p = 1
for x in lst:
    p *= x
print(p)