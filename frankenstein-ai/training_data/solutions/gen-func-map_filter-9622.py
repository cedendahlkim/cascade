# Task: gen-func-map_filter-9622 | Score: 100% | 2026-02-10T19:17:07.716334

def main():
    n = int(input())
    nums = []
    for _ in range(n):
        nums.append(int(input()))

    even_nums = list(filter(lambda x: x % 2 == 0, nums))
    multiplied_nums = list(map(lambda x: x * 3, even_nums))

    if len(multiplied_nums) == 0:
        print('none')
    else:
        print(*multiplied_nums)

if __name__ == "__main__":
    main()