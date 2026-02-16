# Task: gen-func-reduce_product-1537 | Score: 100% | 2026-02-15T07:53:06.373171

n = int(input())
lst = [int(input()) for _ in range(n)]
p = 1
for x in lst:
    p *= x
print(p)