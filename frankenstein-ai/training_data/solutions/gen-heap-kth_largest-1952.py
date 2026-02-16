# Task: gen-heap-kth_largest-1952 | Score: 100% | 2026-02-15T14:00:33.775571

def solve():
    nums = list(map(int, input().split()))
    k = int(input())
    nums.sort(reverse=True)
    print(nums[k-1])

solve()