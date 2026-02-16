# Task: gen-heap-kth_largest-5990 | Score: 100% | 2026-02-13T18:38:31.365671

def solve():
    nums = list(map(int, input().split()))
    k = int(input())
    nums.sort(reverse=True)
    print(nums[k-1])

solve()