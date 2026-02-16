# Task: gen-dp-max_subarray-9053 | Score: 100% | 2026-02-15T08:49:14.040954

n = int(input())
lst = [int(input()) for _ in range(n)]
max_sum = curr = lst[0]
for x in lst[1:]:
    curr = max(x, curr + x)
    max_sum = max(max_sum, curr)
print(max_sum)