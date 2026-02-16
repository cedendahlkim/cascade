# Task: gen-func-map_filter-1407 | Score: 100% | 2026-02-10T15:45:29.294516

n = int(input())
numbers = []
for _ in range(n):
    numbers.append(int(input()))

even_numbers = list(filter(lambda x: x % 2 == 0, numbers))
multiplied_numbers = list(map(lambda x: x * 3, even_numbers))

if multiplied_numbers:
    print(*multiplied_numbers)
else:
    print('none')