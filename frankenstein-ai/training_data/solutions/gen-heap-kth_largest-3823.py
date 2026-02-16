# Task: gen-heap-kth_largest-3823 | Score: 100% | 2026-02-15T12:29:10.768867

def solve():
    nums = list(map(int, input().split()))
    k = int(input())
    nums.sort(reverse=True)
    print(nums[k-1])

solve()