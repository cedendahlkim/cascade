# Task: gen-algo-running_sum-5259 | Score: 100% | 2026-02-10T15:42:36.325245

n = int(input())
sum_so_far = 0
result = []
for _ in range(n):
  num = int(input())
  sum_so_far += num
  result.append(str(sum_so_far))
print(" ".join(result))