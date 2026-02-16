# Task: gen-heap-kth_largest-4474 | Score: 100% | 2026-02-13T18:38:53.115428

nums = list(map(int, input().split()))
k = int(input())

nums.sort(reverse=True)
print(nums[k-1])