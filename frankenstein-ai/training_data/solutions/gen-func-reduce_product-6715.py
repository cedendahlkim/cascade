# Task: gen-func-reduce_product-6715 | Score: 100% | 2026-02-13T09:41:11.956774

n = int(input())
lst = [int(input()) for _ in range(n)]
p = 1
for x in lst:
    p *= x
print(p)