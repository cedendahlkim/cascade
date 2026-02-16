# Task: gen-heap-kth_largest-4356 | Score: 100% | 2026-02-14T13:12:07.607258

def solve():
    nums = list(map(int, input().split()))
    k = int(input())
    nums.sort(reverse=True)
    print(nums[k-1])

solve()