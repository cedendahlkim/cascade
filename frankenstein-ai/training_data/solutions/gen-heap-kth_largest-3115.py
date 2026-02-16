# Task: gen-heap-kth_largest-3115 | Score: 100% | 2026-02-14T12:14:07.078208

def solve():
    nums = list(map(int, input().split()))
    k = int(input())
    nums.sort(reverse=True)
    print(nums[k-1])

solve()