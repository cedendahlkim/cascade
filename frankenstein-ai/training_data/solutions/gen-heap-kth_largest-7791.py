# Task: gen-heap-kth_largest-7791 | Score: 100% | 2026-02-13T21:27:05.758131

def solve():
    nums = list(map(int, input().split()))
    k = int(input())
    nums.sort(reverse=True)
    print(nums[k-1])

solve()