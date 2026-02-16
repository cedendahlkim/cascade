# Task: gen-heap-kth_largest-5184 | Score: 100% | 2026-02-14T12:13:55.535246

def solve():
    nums = list(map(int, input().split()))
    k = int(input())
    nums.sort(reverse=True)
    print(nums[k-1])

solve()