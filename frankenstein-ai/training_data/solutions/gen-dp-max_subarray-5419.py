# Task: gen-dp-max_subarray-5419 | Score: 100% | 2026-02-13T10:38:17.903053

n = int(input())
lst = [int(input()) for _ in range(n)]
max_sum = curr = lst[0]
for x in lst[1:]:
    curr = max(x, curr + x)
    max_sum = max(max_sum, curr)
print(max_sum)