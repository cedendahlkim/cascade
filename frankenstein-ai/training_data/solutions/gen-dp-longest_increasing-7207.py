# Task: gen-dp-longest_increasing-7207 | Score: 100% | 2026-02-11T11:13:02.073425

def solve():
    n = int(input())
    arr = []
    for _ in range(n):
        arr.append(int(input()))

    tails = []
    for num in arr:
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