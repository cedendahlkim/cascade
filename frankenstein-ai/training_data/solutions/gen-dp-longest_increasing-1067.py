# Task: gen-dp-longest_increasing-1067 | Score: 100% | 2026-02-11T09:11:15.747608

def solve():
    n = int(input())
    nums = [int(input()) for _ in range(n)]
    
    tails = []
    
    for num in nums:
        if not tails or num > tails[-1]:
            tails.append(num)
        else:
            l, r = 0, len(tails) - 1
            while l <= r:
                mid = (l + r) // 2
                if tails[mid] < num:
                    l = mid + 1
                else:
                    r = mid - 1
            tails[l] = num
    
    print(len(tails))

solve()