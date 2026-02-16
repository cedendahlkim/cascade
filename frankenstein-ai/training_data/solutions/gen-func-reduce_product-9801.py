# Task: gen-func-reduce_product-9801 | Score: 100% | 2026-02-13T11:52:59.313992

n = int(input())
lst = [int(input()) for _ in range(n)]
p = 1
for x in lst:
    p *= x
print(p)