# Task: gen-dp-longest_increasing-6545 | Score: 100% | 2026-02-10T18:09:08.374904

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