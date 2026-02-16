# Task: gen-heap-kth_largest-4849 | Score: 100% | 2026-02-13T18:57:56.363089

def solve():
    nums = list(map(int, input().split()))
    k = int(input())
    nums.sort(reverse=True)
    print(nums[k-1])

solve()