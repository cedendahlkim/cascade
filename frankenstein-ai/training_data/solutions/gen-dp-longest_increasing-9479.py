# Task: gen-dp-longest_increasing-9479 | Score: 100% | 2026-02-10T18:31:18.997729

def longest_increasing_subsequence(arr):
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
    return len(tails)

n = int(input())
arr = []
for _ in range(n):
    arr.append(int(input()))

print(longest_increasing_subsequence(arr))