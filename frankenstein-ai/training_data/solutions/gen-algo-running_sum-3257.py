# Task: gen-algo-running_sum-3257 | Score: 100% | 2026-02-12T12:14:32.835314

n = int(input())
sum_so_far = 0
result = []
for _ in range(n):
    num = int(input())
    sum_so_far += num
    result.append(str(sum_so_far))
print(" ".join(result))