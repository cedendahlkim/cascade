# Task: gen-algo-remove_duplicates-9648 | Score: 100% | 2026-02-12T13:13:38.463268

n = int(input())
nums = []
unique_nums = []
for _ in range(n):
    num = int(input())
    if num not in unique_nums:
        unique_nums.append(num)
        nums.append(str(num))

print(' '.join(nums))