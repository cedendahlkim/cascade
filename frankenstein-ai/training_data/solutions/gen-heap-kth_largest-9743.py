# Task: gen-heap-kth_largest-9743 | Score: 100% | 2026-02-13T18:34:17.224875

nums = list(map(int, input().split()))
k = int(input())
nums.sort(reverse=True)
print(nums[k-1])