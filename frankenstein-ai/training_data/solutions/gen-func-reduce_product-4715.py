# Task: gen-func-reduce_product-4715 | Score: 100% | 2026-02-13T17:35:42.251572

n = int(input())
lst = [int(input()) for _ in range(n)]
p = 1
for x in lst:
    p *= x
print(p)