# Task: gen-func-map_filter-8558 | Score: 100% | 2026-02-12T17:20:56.269451

n = int(input())
numbers = []
for _ in range(n):
    numbers.append(int(input()))

even_numbers = list(filter(lambda x: x % 2 == 0, numbers))
multiplied_numbers = list(map(lambda x: x * 3, even_numbers))

if len(multiplied_numbers) == 0:
    print('none')
else:
    print(*multiplied_numbers)