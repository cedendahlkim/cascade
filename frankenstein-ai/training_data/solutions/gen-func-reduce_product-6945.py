# Task: gen-func-reduce_product-6945 | Score: 100% | 2026-02-15T09:51:13.469594

n = int(input())
lst = [int(input()) for _ in range(n)]
p = 1
for x in lst:
    p *= x
print(p)