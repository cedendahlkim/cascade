# Task: gen-heap-kth_largest-1439 | Score: 100% | 2026-02-14T12:36:36.064812

def solve():
    nums = list(map(int, input().split()))
    k = int(input())
    nums.sort(reverse=True)
    print(nums[k-1])

solve()