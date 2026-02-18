# Task: gen-encode-base-3714 | Score: 100% | 2026-02-17T20:33:12.813771

def solve():
    num_str = input()
    from_base = int(input())
    to_base = int(input())

    try:
        num_int = int(num_str, from_base)
    except ValueError:
        print("Invalid input number for the given base.")
        return

    if to_base == 10:
        print(num_int)
        return

    result = ""
    if num_int == 0:
        print(0)
        return

    while num_int > 0:
        remainder = num_int % to_base
        if remainder < 10:
            result = str(remainder) + result
        else:
            result = chr(ord('A') + remainder - 10) + result
        num_int //= to_base

    print(result)

solve()