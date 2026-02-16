# Task: gen-heap-kth_largest-9152 | Score: 100% | 2026-02-13T18:58:32.526180

def solve():
    nums = list(map(int, input().split()))
    k = int(input())
    nums.sort(reverse=True)
    print(nums[k-1])

solve()