# Task: gen-dp-longest_increasing-4897 | Score: 100% | 2026-02-10T17:21:46.816793

def solve():
    n = int(input())
    nums = []
    for _ in range(n):
        nums.append(int(input()))
    
    dp = []
    for num in nums:
        if not dp or num > dp[-1]:
            dp.append(num)
        else:
            l, r = 0, len(dp) - 1
            while l <= r:
                mid = (l + r) // 2
                if dp[mid] < num:
                    l = mid + 1
                else:
                    r = mid - 1
            dp[l] = num
    
    print(len(dp))

solve()