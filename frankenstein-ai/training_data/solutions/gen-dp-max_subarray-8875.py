# Task: gen-dp-max_subarray-8875 | Score: 100% | 2026-02-13T13:43:13.412989

n = int(input())
lst = [int(input()) for _ in range(n)]
max_sum = curr = lst[0]
for x in lst[1:]:
    curr = max(x, curr + x)
    max_sum = max(max_sum, curr)
print(max_sum)